import React, { useEffect, useState, useCallback, memo } from "react";
import { Handle } from "reactflow";

const classOptionsMap = {
  activation: ["AC", "UP", "RD"],
  reduction: ["CM", "CMUP"],
  shipment: ["SH", "UP", "CMUP"],
};

const EFFECT_LABEL = {
  "receipt": "Receipt",
  "stored up": "Stored ↑",
  "stored down": "Stored ↓",
  "active up": "Active ↑",
  "active down": "Active ↓",
  "shipment": "Shipment →",
};

function ActionNode({ data, id }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  // structured params: main_0 (1st user main), main_1, opt_0, opt_1, ...
  const [params, setParams] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const stopEvt = useCallback((e) => e.stopPropagation(), []);
  const pushField = useCallback(
    (field, value) => data.onFieldChange && data.onFieldChange(id, field, value),
    [data, id]
  );

  // Push structured params + legacy mirrors (first three visible in order)
  const pushParams = useCallback(() => {
    pushField("params", params);
    const ordered = Object.keys(params).sort(); // "main_0","main_1","opt_0",...
    pushField("param1", ordered[0] ? params[ordered[0]] : "");
    pushField("param2", ordered[1] ? params[ordered[1]] : "");
    pushField("param3", ordered[2] ? params[ordered[2]] : "");
  }, [params, pushField]);

  const onParamKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pushParams();
      }
      if (e.altKey && (e.key === "a" || e.key === "A"))) {
        e.preventDefault();
        setShowAdvanced((s) => !s);
      }
    },
    [pushParams]
  );

  // hydrate from upstream token (productId is implicit/hidden)
  useEffect(() => {
    if (!data.token) return;
    setSelectedClass((data.token.type || "").toUpperCase());
    setSelectedFunctionId(data.token.func || "");

    // legacy -> structured: first user main is main_0 (right after productId)
    const next = {};
    if (data.token.param1) next["main_0"] = data.token.param1;
    if (data.token.param2) next["opt_0"]  = data.token.param2;
    if (data.token.param3) next["opt_1"]  = data.token.param3;
    setParams(next);
  }, [data.token?.id, data.token]);

  // auto-pick function if only one exists for the class
  useEffect(() => {
    if (selectedClass && data.registryMap) {
      const funcs = data.registryMap.get(selectedClass) || [];
      if (funcs.length === 1) {
        const onlyId = funcs[0].id;
        setSelectedFunctionId(onlyId);
        pushField("func", onlyId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, data.registryMap]);

  // -------- derive view data --------
  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions = (selectedClass && data.registryMap.get(selectedClass)) || [];
  const selectedFunction = availableFunctions.find((fn) => fn.id === selectedFunctionId);
  const meta = (selectedFunction && selectedFunction.meta_data) || {};

  // counts (rawMain includes productId)
  const rawMain = Math.max(0, meta.mainParams || 0);
  const visibleMain = Math.max(0, rawMain - 1); // user mains (exclude productId)
  const optCount = Math.max(0, meta.optionalParams || 0);

  // description handling
  const descs = Array.isArray(meta.optionalDesc) ? meta.optionalDesc : [];
  const includesProductIdDesc = descs.length === (rawMain + optCount); // full list includes productId label
  const getDesc = (idx, fallback) => (descs[idx] && descs[idx].desc) || fallback;

  // labels in UI order: visible mains, then optionals
  const labels = [];
  // visible main labels
  for (let i = 0; i < visibleMain; i++) {
    const base = includesProductIdDesc ? 1 : 0; // skip productId label if it's present
    labels.push(getDesc(base + i, `Main param ${i + 1}`));
  }
  // optional labels
  for (let j = 0; j < optCount; j++) {
    const base = includesProductIdDesc ? rawMain : 0; // jump past all raw main labels if present
    labels.push(getDesc(base + j, `Optional param ${j + 1}`));
  }

  // field descriptors: keys are main_0.. and opt_0..
  const fields = [];
  for (let i = 0; i < visibleMain; i++) {
    fields.push({ key: `main_${i}`, label: labels[i], required: true });
  }
  for (let j = 0; j < optCount; j++) {
    fields.push({ key: `opt_${j}`, label: labels[visibleMain + j], required: false });
  }

  // effect chips
  const rawEffects = Array.isArray(meta.effect) ? meta.effect : (meta.effect ? [meta.effect] : []);
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

      {/* Class selector */}
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

      {/* Function selector */}
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
      {selectedFunction && selectedFunction.desc ? (
        <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic", color: "white" }}>
          {selectedFunction.desc}
        </div>
      ) : null}

      {/* Meta summary */}
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
          Needs <b>{visibleMain}</b> required
          {optCount ? <> and <b>{optCount}</b> optional</> : null} param
          {(visibleMain + optCount) === 1 ? "" : "s"} (productId is auto-supplied).
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

      {/* Required user mains (main_0, main_1, ...) */}
      <div style={{ marginTop: 8 }}>
        {fields.filter(f => f.required).map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "black" }}>{label} *</span>
            <input
              type="text"
              placeholder={label}
              value={params[key] || ""}
              onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
              onBlur={pushParams}
              onKeyDown={onParamKeyDown}
              onMouseDown={stopEvt}
              style={{ width: "100%", color: "black" }}
            />
          </div>
        ))}
      </div>

      {/* Optional params */}
      {optCount > 0 && (
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(s => !s)}
            onMouseDown={stopEvt}
            onKeyDown={onParamKeyDown}
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
            {showAdvanced ? "Hide Advanced" : `Advanced (${optCount})`}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 6 }}>
              {fields.filter(f => !f.required).map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "black" }}>{label} (optional)</span>
                  <input
                    type="text"
                    placeholder={label}
                    value={params[key] || ""}
                    onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                    onBlur={pushParams}
                    onKeyDown={onParamKeyDown}
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
