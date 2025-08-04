import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function ActionNode({ data }) {
  const [selectedClass, setSelectedClass] = useState(data.type || '');
  const [selectedFunctionId, setSelectedFunctionId] = useState(data.func || '');
  const [param1, setParam1] = useState(data.param1 || '');
  const [param2, setParam2] = useState(data.param2 || '');
  const [param3, setParam3] = useState(data.param3 || '');

  // 🔁 Update local state if props change (optional, for prop-driven re-renders)
  useEffect(() => {
    setSelectedClass(data.type || '');
    setSelectedFunctionId(data.func || '');
    setParam1(data.param1 || '');
    setParam2(data.param2 || '');
    setParam3(data.param3 || '');
  }, [data.type, data.func, data.param1, data.param2, data.param3]);

  // ✅ Sync to parent tree
  useEffect(() => {
    if (data?.onFieldChange) {
      data.onFieldChange(data.id, 'type', selectedClass);
      data.onFieldChange(data.id, 'func', selectedFunctionId);
      data.onFieldChange(data.id, 'param1', param1);
      data.onFieldChange(data.id, 'param2', param2);
      data.onFieldChange(data.id, 'param3', param3);
    }
  }, [selectedClass, selectedFunctionId, param1, param2, param3]);

  const allowedFunctions = (data.registryMap?.[selectedClass] || []).map((fn) => ({
    id: fn.id,
    name: fn.name,
  }));

  return (
    <div style={{
      border: '1px solid #666',
      borderRadius: 12,
      padding: 8,
      width: 260,
      backgroundColor: '#f3f3f3',
    }}>
      <Handle type="target" position={Position.Top} />

      <div style={{ fontWeight: 600, marginBottom: 4 }}>Action</div>

      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
        <option value="">-- Class --</option>
        {(data.allowedClasses || []).map(cls => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>

      <select value={selectedFunctionId} onChange={(e) => setSelectedFunctionId(e.target.value)}>
        <option value="">-- Function --</option>
        {allowedFunctions.map(fn => (
          <option key={fn.id} value={fn.id}>{fn.name}</option>
        ))}
      </select>

      <input type="text" placeholder="Param 1" value={param1} onChange={(e) => setParam1(e.target.value)} />
      <input type="text" placeholder="Param 2" value={param2} onChange={(e) => setParam2(e.target.value)} />
      <input type="text" placeholder="Param 3" value={param3} onChange={(e) => setParam3(e.target.value)} />

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default ActionNode;
