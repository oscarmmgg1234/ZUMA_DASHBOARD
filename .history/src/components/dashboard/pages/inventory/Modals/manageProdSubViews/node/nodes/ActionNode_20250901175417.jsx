import React, { useEffect, useState, useCallback, memo } from "react";
import { Handle } from "reactflow";

const classOptionsMap: Record<string, string[]> = {
  activation: ["AC", "UP", "RD"],
  reduction:  ["CM", "CMUP"],
  shipment:   ["SH", "UP", "CMUP"],
};

// Chip labels for meta_data.effect[]
const EFFECT_LABEL: Record<string, string> = {
  "receipt":     "Receipt",
  "stored up":   "Stored ↑",
  "stored down": "Stored ↓",
  "active up":   "Active ↑",
  "active down": "Active ↓",
  "shipment":    "Shipment →",
};

type RegistryFn = {
  id: string;
  name: string;
  desc?: string;
  class: string;
  meta_data?: {
    mainParams?: number;
    optionalParams?: number;
    optionalDesc?: { desc: string }[];
    effect?: string[] | string;
    userSummary?: string;
  };
};

type Props = {
  id: string;
  data: {
    route: keyof typeof classOptionsMap;
    registryMap: Map<string, RegistryFn[]>; // keyed by class: "AC" | "UP" | ...
    token?: {
      id?: string;           // stable identity/uuid for the node selection
      type?: string;         // class (AC/UP/RD/...)
      func?: string;         // function id
      param1?: string;       // legacy
      param2?: string;       // legacy
      param3?: string;       // legacy
    };
    onFieldChange?: (nodeId: string, field: string, value: any) => void;
  };
};

function ActionNode({ data, id }: Props) {
  // ---------------- state ----------------
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  // meta-driven param values, keyed as main_0, main_1, opt_0, opt_1, ...
  const [params, setParams] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ---------------- helpers ----------------
  const stopEvt = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), []);

  const pushField = useCallback(
    (field: string, value: any) => data.onFieldChange?.(id, field, value),
    [data, id]
  );

  // Push all current params to parent (and map first three to legacy keys)
  const pushParams = useCallback(() => {
    // always push the structured params object
    pushField("params", params);

    // maintain backward compatibility with existing pipeline
    const orderedKeys = Object.keys(params).sort(); // main_0, main_1, opt_0, opt_1, ...
    pushField("param1", orderedKeys[0] ? params[orderedKeys[0]] : "");
    pushField("param2", orderedKeys[1] ? params[orderedKeys[1]] : "");
    pushField("param3", orderedKeys[2] ? params[orderedKeys[2]] : "");
  }, [params, pushField]);

  const onParamKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // ---------------- hydrate from upstream token (stable identity) ----------------
  useEffect(() => {
    if (!data.token) return;
    setSelectedClass((data.token.type || "").toUpperCase());
    setSelectedFunctionId(data.token.func || "");

    // migrate legacy param1..3 -> structured keys if present
    const next: Record<string, string> = {};
    if (data.token.param1) next["main_0"] = data.token.param1;
    if (data.token.param2) next["opt_0"]  = data.token.param2;
    if (data.token.param3) next["opt_1"]  = data.token.param3;
    setParams(next);
  }, [data.token?.id, data.token]);

  // ---------------- auto-pick function if only one in the class ----------------
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

  // ---------------- derive view data ----------------
  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions: RegistryFn[] =
    (selectedClass && data.registryMap.get(selectedClass)) || [];
  const selectedFunction = availableFunctions.find((fn) => fn.id === selectedFunctionId);

  const meta = selectedFunction?.meta_data || {};
  const mainCount = Math.max(0, meta.mainParams ?? 0);
  const optCount  = Math.max(0, meta.optionalParams ?? 0);
  const totalCount = mainCount + optCount;

  // field descriptors (label from optionalDesc[i].desc with graceful fallback)
  const fields = Array.from({ length: totalCount }, (_, i) => {
    const required = i < mainCount;
    const key = required ? `main_${i}` : `opt_${i - mainCount}`;
    const label =
      meta.optionalDesc?.[i]?.desc ||
      (required ? `Main param ${i + 1}` : `Optional param ${i - mainCount + 1}`);
    return { key, label, required, index: i };
  });

  // effects normalized to unique array
  const effects: string[] = Array.isArray(meta.effect)
    ? meta.effect
    : (meta.effect ? [meta.effect] : []);
  const uniqueEffects = Array.from(new Set(effects));

  // ---------------- render ----------------
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
          setParams({});                 // clear previous params on function change
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
      {selectedFunction?.desc && (
        <div style={{ marginTop: 6, fontSize: 12, fontStyle: "italic", color: "white" }}>
          {selectedFunction.desc}
        </div>
      )}

      {/* One-line meta summary: required/optional and userSummary */}
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
          {meta.userSummary ? `${meta.userSummary} — ` : ""}
          Needs <b>{mainCount}</b> required{optCount ? ` and <b>${optCount}</b> optional` : ""} param
          {(mainCount + optCount) === 1 ? "" : "s"}.
        </div>
      )}

      {/* Effect chips (inline) */}
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
        {fields.filter(f => f.required).map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: "black" }}>{label} *</span>
            </div>
            <input
              type="text"
              placeholder={label}
              value={params[key] ?? ""}
              onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
              onBlur={pushParams}
              onKeyDown={onParamKeyDown}
              onMouseDown={stopEvt}
              style={{ width: "100%", color: "black" }}
            />
            <div style={{ fontSize: 11, color: "#e5e7eb", marginTop: 2 }}>Required</div>
          </div>
        ))}
      </div>

      {/* Advanced (optional) */}
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

          {/* Ghost list when collapsed */}
          {!showAdvanced && (
            <div style={{ marginTop: 6 }}>
              {fields.filter(f => !f.required).map(({ key, label }) => (
                <div key={key} style={{ fontSize: 11, color: "#111827", opacity: 0.7, marginBottom: 4 }}>
                  {label}
                </div>
              ))}
            </div>
          )}

          {/* Optional inputs when expanded */}
          {showAdvanced && (
            <div style={{ marginTop: 6 }}>
              {fields.filter(f => !f.required).map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, color: "black" }}>{label}</span>
                    <span
                      style={{
                        fontSize: 10, padding: "0 6px", borderRadius: 999,
                        border: "1px solid #e5e7eb", color: "#374151", background: "rgba(255,255,255,0.6)"
                      }}
                    >
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={label}
                    value={params[key] ?? ""}
                    onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                    onBlur={pushParams}
                    onKeyDown={onParamKeyDown}
                    onMouseDown={stopEvt}
                    style={{ width: "100%", color: "black" }}
                  />
                  <div style={{ fontSize: 11, color: "#e5e7eb", marginTop: 2 }}>Optional</div>
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
