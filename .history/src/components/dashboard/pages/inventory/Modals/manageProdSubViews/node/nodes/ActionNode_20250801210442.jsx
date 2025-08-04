import React, { useState, useEffect } from 'react';
import { Handle } from 'reactflow';

const classOptionsMap = {
  activation: ['AC', 'UP', 'RD'],
  reduction: ['CM', 'CMUP'],
  shipment: ['SH', 'UP', 'CMUP'],
};

export default function ActionNode({ data, selected, id }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFunctionId, setSelectedFunctionId] = useState('');
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  const [param3, setParam3] = useState('');

  // ✅ Initialize from token on first render
  useEffect(() => {
    if (data.token) {
      setSelectedClass((data.token.type || '').toUpperCase());
      setSelectedFunctionId((data.token.func || '').toLowerCase());
      setParam1(data.token.param1 || '');
      setParam2(data.token.param2 || '');
      setParam3(data.token.param3 || '');
    }
  }, [data.token]);

  useEffect(() => {
    console.log("🧩 Token in ActionNode:", data.token);
  }, [data.token]);

  // 🔁 Auto-select if only one function exists
  useEffect(() => {
    if (selectedClass && data.registryMap && !selectedFunctionId) {
      const funcs = data.registryMap.get(selectedClass) || [];
      if (funcs.length === 1) {
        setSelectedFunctionId(funcs[0].id.toLowerCase());
      }
    }
  }, [selectedClass]);

  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions =
    selectedClass && data.registryMap.get(selectedClass) || [];

  const selectedFunction = availableFunctions.find(
    (fn) => fn.id.toLowerCase() === selectedFunctionId
  );

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #ccc',
        borderRadius: 4,
        background: 'rgba(0,0,0,0.5)',
        width: 250,
      }}
    >
      <Handle type="target" position="top" />

      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Action Node</div>

      <label style={{ color: 'black' }}>Class:</label>
      <select
        style={{ color: 'black', width: '100%' }}
        value={selectedClass}
        onChange={(e) => {
          setSelectedClass(e.target.value);
          setSelectedFunctionId('');
        }}
      >
        <option value="">-- Select Class --</option>
        {availableClasses.map((cls) => (
          <option key={cls} value={cls}>
            {cls}
          </option>
        ))}
      </select>

      <label style={{ marginTop: 6, color: 'black' }}>Function:</label>
      <select
        style={{ color: 'black', width: '100%' }}
        value={selectedFunctionId}
        onChange={(e) => setSelectedFunctionId(e.target.value)}
        disabled={!selectedClass}
      >
        <option value="">-- Select Function --</option>
        {availableFunctions.map((fn) => (
          <option key={fn.id} value={fn.id.toLowerCase()}>
            {fn.name}
          </option>
        ))}
      </select>

      {selectedFunction && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontStyle: 'italic',
            color: 'black',
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
          style={{ width: '100%', marginBottom: 4, color: 'black' }}
        />
        <input
          type="text"
          placeholder="Param 2"
          value={param2}
          onChange={(e) => setParam2(e.target.value)}
          style={{ width: '100%', marginBottom: 4, color: 'black' }}
        />
        <input
          type="text"
          placeholder="Param 3"
          value={param3}
          onChange={(e) => setParam3(e.target.value)}
          style={{ width: '100%', color: 'black' }}
        />
      </div>

     

      <Handle type="source" position="bottom" />
    </div>
  );
}
