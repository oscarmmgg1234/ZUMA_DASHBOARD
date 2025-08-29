import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { Handle } from "reactflow";

const classOptionsMap = {
  activation: ["AC", "UP", "RD"],
  reduction: ["CM", "CMUP"],
  shipment: ["SH", "UP", "CMUP"],
};

function ActionNode({ data, id }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  const [param1, setParam1] = useState("");
  const [param2, setParam2] = useState("");
  const [param3, setParam3] = useState("");

  // ---- helpers ----------------------------------------------------
  const stopEvt = useCallback((e) => {
    // Prevent React Flow selection/drag bubbling that can also cause re-renders
    e.stopPropagation();
  }, []);

  const pushField = useCallback(
    (field, value) => {
      // Guard: don't hammer parent on every keypress.
      // We'll call this from onBlur / onEnter / discrete changes.
      data.onFieldChange?.(id, field, value);
    },
    [data, id]
  );

  const pushParams = useCallback(() => {
    pushField("param1", param1);
    pushField("param2", param2);
    pushField("param3", param3);
  }, [pushField, param1, param2, param3]);

  const onParamKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        pushParams();
        // keep focus where it is; no blur required
      }
    },
    [pushParams]
  );

  // ---- sync from upstream token only when token identity changes ---
  useEffect(() => {
    if (!data.token) return;
    setSelectedClass((data.token.type || "").toUpperCase());
    setSelectedFunctionId(data.token.func || "");
    setParam1(data.token.param1 || "");
    setParam2(data.token.param2 || "");
    setParam3(data.token.param3 || "");
  }, [data.token?.id /* or a stable version/uuid of the token */, data.token]); 
  // ^ If you can, pass a stable token.id/version so this effect
  //   doesn't run on every parent render with a new object ref.

  // ---- auto-pick function if only one available -------------------
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

  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions =
    (selectedClass && data.registryMap.get(selectedClass)) || [];
  const selectedFunction = availableFunctions.find(
    (fn) => fn.id === selectedFunctionId
  );

  return (
    <div
      style={{
        padding: 10,
        border: "6px solid #ccc",
        borderRadius: 15,
        background: "#a7c1eed2",
        width: 260,
      }}
      onMouseDown={stopEvt} // make the whole node ignore drag/select while interacting
    >
      <Handle
        type="target"
        position="top"
        style={{ background: "#555", width: 10, height: 10 }}
      />

      <div style={{ fontWeight: "bold", marginBottom: 6, fontSize: 23 }}>
        Action
      </div>

      <label style={{ color: "black" }}>Class:</label>
      <select
        style={{ color: "black", width: "100%", fontSize: 23 }}
        value={selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedClass(val);
          setSelectedFunctionId("");
          pushField("type", val); // sync discretely
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

      <label style={{ marginTop: 6, color: "black", fontSize: 23 }}>
        Function:
      </label>
      <select
        style={{ color: "black", width: "100%", fontSize: 23 }}
        value={selectedFunctionId}
        disabled={!selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedFunctionId(val);
          pushField("func", val); // sync discretely
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

      {selectedFunction && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontStyle: "italic",
            color: "white",
          }}
        >
          {selectedFunction.desc}
        </div>
      )}

      <div style={{ marginTop: 6 }}>
        <input
          type="text"
          placeholder="Param 1"
          value={param1}
          onChange={(e) => setParam1(e.target.value)}
          onBlur={pushParams}
          onKeyDown={onParamKeyDown}
          onMouseDown={stopEvt}
          style={{ width: "100%", marginBottom: 4, color: "black" }}
        />
        <input
          type="text"
          placeholder="Param 2"
          value={param2}
          onChange={(e) => setParam2(e.target.value)}
          onBlur={pushParams}
          onKeyDown={onParamKeyDown}
          onMouseDown={stopEvt}
          style={{ width: "100%", marginBottom: 4, color: "black" }}
        />
        <input
          type="text"
          placeholder="Param 3"
          value={param3}
          onChange={(e) => setParam3(e.target.value)}
          onBlur={pushParams}
          onKeyDown={onParamKeyDown}
          onMouseDown={stopEvt}
          style={{ width: "100%", color: "black" }}
        />
      </div>

      <Handle
        type="source"
        position="bottom"
        style={{ background: "#555", width: 10, height: 10 }}
      />
    </div>
  );
}

// Make remounts rarer: if parent passes equal props (shallow), skip re-render.
// Also ensure the node's React "key" in the nodes array is the stable `id`.
export default memo(ActionNode);
