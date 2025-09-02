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
  const [params, setParams] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const stopEvt = useCallback((e) => e.stopPropagation(), []);

  const pushField = useCallback(
    (field, value) => data.onFieldChange && data.onFieldChange(id, field, value),
    [data, id]
  );

  const pushParams = useCallback(() => {
    pushField("params", params);

    // legacy mapping: first three visible params
    const orderedKeys = Object.keys(params).sort();
    pushField("param1", orderedKeys[0] ? params[orderedKeys[0]] : "");
    pushField("param2", orderedKeys[1] ? params[orderedKeys[1]] : "");
    pushField("param3", orderedKeys[2] ? params[orderedKeys[2]] : "");
  }, [params, pushField]);

  const onParamKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pushParams();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setShowAdvanced((s) => !s);
      }
    },
    [pushParams]
  );

  // hydrate from token
  useEffect(() => {
    if (!data.token) return;
    setSelectedClass((data.token.type || "").toUpperCase());
    setSelectedFunctionId(data.token.func || "");

    const next = {};
    if (data.token.param1) next["main_1"] = data.token.param1; // shift: main_0 = productId (excluded)
    if (data.token.param2) next["opt_0"] = data.token.param2;
    if (data.token.param3) next["opt_1"] = data.token.param3;
    setParams(next);
  }, [data.token?.id, data.token]);

  // auto-pick single function
  useEffect(() => {
    if (selectedClass && data.registryMap) {
      const funcs = data.registryMap.get(selectedClass) || [];
      if (funcs.length === 1) {
        const onlyId = funcs[0].id;
        setSelectedFunctionId(onlyId);
        pushField("func", onlyId);
      }
    }
  }, [selectedClass, data.registryMap, pushField]);

  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions =
    (selectedClass && data.registryMap.get(selectedClass)) || [];
  const selectedFunction = availableFunctions.find(
    (fn) => fn.id === selectedFunctionId
  );

  const meta = (selectedFunction && selectedFunction.meta_data) || {};
  const rawMainCount = Math.max(0, meta.mainParams || 0);
  const mainCount = Math.max(0, rawMainCount - 1); // exclude productId
  const optCount = Math.max(0, meta.optionalParams || 0);
  const totalCount = mainCount + optCount;

  // build visible field descriptors
  const fields = Array.from({ length: totalCount }, (_, i) => {
    const required = i < mainCount;
    // shift index by +1 since main_0 is productId
    const key = required ? `main_${i + 1}` : `opt_${i - mainCount}`;
    const label =
      (meta.optionalDesc &&
        meta.optionalDesc[i + 1] && // shift because desc[0] = productId
        meta.optionalDesc[i + 1].desc) ||
      (required ? `Main param ${i + 1}` : `Optional param ${i - mainCount + 1}`);
    return { key, label, required };
  });

  const rawEffects = Array.isArray(meta.effect)
    ? meta.effect
    : meta.effect
    ? [meta.effect]
    : [];
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

      {/* Function description */}
      {selectedFunction && selectedFunction.desc && (
        <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic", color: "white" }}>
          {selectedFunction.desc}
        </div>
      )}

      {/* Summary */}
      {selectedFunctionId && (
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
          Needs <b>{mainCount}</b> required
          {optCount ? <> and <b>{optCount}</b> optional</> : null} param
          {totalCount === 1 ? "" : "s"} (productId is auto-supplied).
        </div>
      )}

      {/* Effect chips */}
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

      {/* Required params (excluding productId) */}
      <div style={{ marginTop: 8 }}>
        {fields.filter((f) => f.required).map(({ key, label }) => (
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
            onClick={() => setShowAdvanced((s) => !s)}
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
              {fields.filter((f) => !f.required).map(({ key, label }) => (
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
