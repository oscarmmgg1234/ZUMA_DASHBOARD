import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { Handle } from "reactflow";

const classOptionsMap = {
  activation: ["AC", "UP", "RD"],
  reduction: ["CM", "CMUP"],
  shipment: ["SH", "UP", "CMUP"],
};

const EFFECT_LABEL = {
  receipt: "Receipt",
  "stored up": "Stored ↑",
  "stored down": "Stored ↓",
  "active up": "Active ↑",
  "active down": "Active ↓",
  shipment: "Shipment →",
};

// ---------- helpers ----------
const stopEvt = (e) => e.stopPropagation();

function getSpecFromMeta(meta) {
  const p = meta?.params;
  if (Array.isArray(p) && p.length) return p;

  // legacy fallback (rare now because backend builds params[])
  const rawMain = Math.max(0, Number(meta?.mainParams || 0));
  const visibleMain = Math.max(0, rawMain - 1);
  const optCount = Math.max(0, Number(meta?.optionalParams || 0));
  const descs = Array.isArray(meta?.optionalDesc) ? meta.optionalDesc : [];
  const includesProductIdDesc = descs.length === rawMain + optCount;

  const getDesc = (idx, fallback) =>
    (descs[idx] && (descs[idx].desc || descs[idx])) || fallback;

  const spec = [{ key: "productId", role: "productId", hidden: true, required: true }];

  for (let i = 0; i < visibleMain; i++) {
    const base = includesProductIdDesc ? 1 : 0;
    spec.push({
      key: `main_${i}`,
      label: getDesc(base + i, `Main param ${i + 1}`),
      type: "text",
      required: true,
    });
  }
  for (let j = 0; j < optCount; j++) {
    const base = includesProductIdDesc ? rawMain : 0;
    spec.push({
      key: `opt_${j}`,
      label: getDesc(base + j, `Optional param ${j + 1}`),
      type: "text",
      required: false,
    });
  }
  return spec;
}

function buildTokenSig(t) {
  return [
    t?.id || "",
    (t?.type || "").toUpperCase(),
    t?.func || "",
    // include both structured and legacy in the signature
    JSON.stringify(t?.params || {}),
    t?.param1 ?? "",
    t?.param2 ?? "",
    t?.param3 ?? "",
  ].join("|");
}

function ActionNode({ data, id }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  const [params, setParams] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const pushField = useCallback(
    (field, value) => data.onFieldChange && data.onFieldChange(id, field, value),
    [data, id]
  );

  // mirror to parent (structured + legacy mirror of first three visible fields)
  const pushParams = useCallback(
    (spec) => {
      pushField("params", params);

      const visible = (spec || []).filter((p) => !p.hidden);
      const required = visible.filter((p) => !!p.required);
      const optional = visible.filter((p) => !p.required);
      const order = [...required, ...optional].map((p) => p.key);

      pushField("param1", order[0] ? params[order[0]] ?? "" : "");
      pushField("param2", order[1] ? params[order[1]] ?? "" : "");
      pushField("param3", order[2] ? params[order[2]] ?? "" : "");
    },
    [params, pushField]
  );

  const onParamKeyDown = useCallback(
    (e, spec) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pushParams(spec);
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setShowAdvanced((s) => !s);
      }
    },
    [pushParams]
  );

  // ===== hydrate class/func on token change (without touching params yet) =====
  const tokenSig = buildTokenSig(data.token);
  const lastHydratedRef = useRef(null);

  useEffect(() => {
    setSelectedClass((data.token?.type || "").toUpperCase());
    setSelectedFunctionId(data.token?.func || "");
    // don't clear params here (prevents flicker); hydration happens below
  }, [data.token?.type, data.token?.func]);

  // auto-pick function if only one exists for a class
  useEffect(() => {
    if (!selectedClass || !data.registryMap) return;
    const funcs = data.registryMap.get(selectedClass) || [];
    if (funcs.length === 1) {
      const onlyId = funcs[0].id;
      setSelectedFunctionId(onlyId);
      pushField("func", onlyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, data.registryMap]);

  // -------- derive view data --------
  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions =
    (selectedClass && data.registryMap && data.registryMap.get(selectedClass)) || [];
  const selectedFunction = availableFunctions.find((fn) => fn.id === selectedFunctionId);
  const meta = (selectedFunction && selectedFunction.meta_data) || {};
  const spec = getSpecFromMeta(meta);

  const visible = spec.filter((p) => !p.hidden);
  const required = visible.filter((p) => !!p.required);
  const optional = visible.filter((p) => !p.required);

  // ===== main hydration: only when token signature changes =====
  useEffect(() => {
    if (!selectedFunctionId) return;
    if (lastHydratedRef.current === tokenSig) return; // already hydrated this version

    const next = {};

    // 1) structured by key, if present
    if (data.token?.params && typeof data.token.params === "object") {
      for (const p of visible) {
        if (p.key in data.token.params) next[p.key] = String(data.token.params[p.key]);
      }
    }

    // 2) fallback: legacy param1/2/3 by visible order
    const orderedKeys = [...required, ...optional].map((p) => p.key);
    if (data.token?.param1 != null && orderedKeys[0] && next[orderedKeys[0]] == null) {
      next[orderedKeys[0]] = String(data.token.param1);
    }
    if (data.token?.param2 != null && orderedKeys[1] && next[orderedKeys[1]] == null) {
      next[orderedKeys[1]] = String(data.token.param2);
    }
    if (data.token?.param3 != null && orderedKeys[2] && next[orderedKeys[2]] == null) {
      next[orderedKeys[2]] = String(data.token.param3);
    }

    if (Object.keys(next).length > 0) {
      setParams((prev) => ({ ...prev, ...next }));
    }
    lastHydratedRef.current = tokenSig;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunctionId, tokenSig, visible.length]);

  // effects chips
  const rawEffects = Array.isArray(meta.effect) ? meta.effect : meta.effect ? [meta.effect] : [];
  const uniqueEffects = Array.from(new Set(rawEffects));

  return (
    <div
      style={{
        padding: 10,
        border: "6px solid #ccc",
        borderRadius: 15,
        background: "#a7c1eed2",
        width: 260,
      }}
      onMouseDown={stopEvt}
    >
      <Handle type="target" position="top" style={{ background: "#555", width: 10, height: 10 }} />

      <div style={{ fontWeight: "bold", marginBottom: 6, fontSize: 23 }}>Action</div>

      {/* Class */}
      <label style={{ color: "black" }}>Class:</label>
      <select
        style={{ color: "black", width: "100%", fontSize: 23 }}
        value={selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedClass(val);
          setSelectedFunctionId("");
          setParams({});
          setShowAdvanced(false);
          lastHydratedRef.current = null;
          pushField("type", val);
        }}
        onMouseDown={stopEvt}
      >
        <option value="">-- Select Class --</option>
        {availableClasses.map((cls) => (
          <option key={cls} value={cls}>
            {cls}
          </option>
        ))}
      </select>

      {/* Function */}
      <label style={{ marginTop: 6, color: "black", fontSize: 23 }}>Function:</label>
      <select
        style={{ color: "black", width: "100%", fontSize: 23 }}
        value={selectedFunctionId}
        disabled={!selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedFunctionId(val);
          setParams({});
          setShowAdvanced(false);
          lastHydratedRef.current = null;
          pushField("func", val);
        }}
        onMouseDown={stopEvt}
      >
        <option value="">-- Select Function --</option>
        {availableFunctions.map((fn) => (
          <option key={fn.id} value={fn.id}>
            {fn.name}
          </option>
        ))}
      </select>

      {/* Description */}
      {selectedFunction?.desc ? (
        <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic", color: "white" }}>
          {selectedFunction.desc}
        </div>
      ) : null}

      {/* Summary */}
      {selectedFunctionId ? (
        <div
          style={{
            marginTop: 8,
            marginBottom: 8,
            padding: "4px 8px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid #e5e7eb",
            fontSize: 12,
            color: "#111827",
          }}
        >
          {meta.userSummary ? meta.userSummary + " — " : ""}
          Needs <b>{required.length}</b> required
          {optional.length ? (
            <>
              {" "}
              and <b>{optional.length}</b> optional
            </>
          ) : null}{" "}
          param{required.length + optional.length === 1 ? "" : "s"} (productId is auto-supplied).
        </div>
      ) : null}

      {/* Effects */}
      {uniqueEffects.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {uniqueEffects.map((e) => (
            <span
              key={e}
              style={{
                fontSize: 11,
                background: "rgba(255,255,255,0.6)",
                padding: "2px 6px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                color: "#111827",
              }}
              title={e}
            >
              {EFFECT_LABEL[e] || e}
            </span>
          ))}
        </div>
      )}

      {/* Required fields */}
      <div style={{ marginTop: 8 }}>
        {required.map((p) => (
          <div key={p.key} style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "black" }}>{p.label || p.key} *</span>
            <input
              type="text"
              placeholder={p.hint || p.label || p.key}
              value={params[p.key] ?? ""}
              onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
              onBlur={() => pushParams(spec)}
              onKeyDown={(e) => onParamKeyDown(e, spec)}
              onMouseDown={stopEvt}
              style={{ width: "100%", color: "black" }}
            />
          </div>
        ))}
      </div>

      {/* Optional fields */}
      {optional.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            onMouseDown={stopEvt}
            onKeyDown={(e) => onParamKeyDown(e, spec)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
            title="Alt+A"
          >
            {showAdvanced ? "Hide Advanced" : `Advanced (${optional.length})`}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 6 }}>
              {optional.map((p) => (
                <div key={p.key} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "black" }}>{p.label || p.key} (optional)</span>
                  <input
                    type="text"
                    placeholder={p.hint || p.label || p.key}
                    value={params[p.key] ?? ""}
                    onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                    onBlur={() => pushParams(spec)}
                    onKeyDown={(e) => onParamKeyDown(e, spec)}
                    onMouseDown={stopEvt}
                    style={{ width: "100%", color: "black" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position="bottom" style={{ background: "#555", width: 10, height: 10 }} />
    </div>
  );
}

export default memo(ActionNode);
