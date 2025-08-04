import React, { useEffect, useState } from 'react';
import { Handle } from 'reactflow';

const classOptionsMap = {
  activation: ['AC', 'UP', 'RD'],
  reduction: ['CM', 'CMUP'],
  shipment: ['SH', 'UP', 'CMUP'],
};

export default function ActionNode({ data, id }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFunctionId, setSelectedFunctionId] = useState('');
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  const [param3, setParam3] = useState('');

  // 🌱 Sync from props to local state
  useEffect(() => {
    if (data.token) {
      setSelectedClass((data.token.type || '').toUpperCase());
      setSelectedFunctionId((data.token.func || '').toLowerCase());
      setParam1(data.token.param1 || '');
      setParam2(data.token.param2 || '');
      setParam3(data.token.param3 || '');
    }
  }, [data.token]);

  // 🧠 Auto-pick only function if class has one entry
  useEffect(() => {
    if (selectedClass && data.registryMap) {
      const funcs = data.registryMap.get(selectedClass) || [];
      if (funcs.length === 1) {
        const onlyId = funcs[0].id.toLowerCase();
        setSelectedFunctionId(onlyId);
        data.onFieldChange?.(id, 'func', onlyId);
      }
    }
  }, [selectedClass]);

  const availableClasses = classOptionsMap[data.route] || [];
  const availableFunctions = selectedClass && data.registryMap.get(selectedClass) || [];
  const selectedFunction = availableFunctions.find(fn => fn.id.toLowerCase() === selectedFunctionId);

  return (
    <div style={{
      padding: 10,
      border: '1px solid #ccc',
      borderRadius: 15,
      background: '#a7c1eed2',
      width: 260
    }}>
      <Handle type="target" position="top" />

      <div style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 23 }}>Action</div>

      <label style={{ color: 'black' }}>Class:</label>
      <select
        style={{ color: 'black', width: '100%', fontSize: 23 }}
        value={selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedClass(val);
          setSelectedFunctionId('');
          data.onFieldChange?.(id, 'type', val);  // 🔄 Update tree field
        }}
      >
        <option value="">-- Select Class --</option>
        {availableClasses.map(cls => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>

      <label style={{ marginTop: 6, color: 'black', fontSize: 23 }}>Function:</label>
      <select
        style={{ color: 'black', width: '100%', fontSize: 23 }}
        value={selectedFunctionId}
        disabled={!selectedClass}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedFunctionId(val);
          data.onFieldChange?.(id, 'func', val); // 🔄 Update tree field
        }}
      >
        <option value="">-- Select Function --</option>
        {availableFunctions.map(fn => (
          <option key={fn.id} value={fn.id.toLowerCase()}>{fn.name}</option>
        ))}
      </select>

      {selectedFunction && (
        <div style={{
          marginTop: 6,
          fontSize: 12,
          fontStyle: 'italic',
          color: 'white'
        }}>
          {selectedFunction.desc}
        </div>
      )}

      <div style={{ marginTop: 6 }}>
        <input
          type="text"
          placeholder="Param 1"
          value={param1}
          onChange={(e) => {
            const val = e.target.value;
            setParam1(val);
            data.onFieldChange?.(id, 'param1', val);
          }}
          style={{ width: '100%', marginBottom: 4, color: 'black' }}
        />
        <input
          type="text"
          placeholder="Param 2"
          value={param2}
          onChange={(e) => {
            const val = e.target.value;
            setParam2(val);
            data.onFieldChange?.(id, 'param2', val);
          }}
          style={{ width: '100%', marginBottom: 4, color: 'black' }}
        />
        <input
          type="text"
          placeholder="Param 3"
          value={param3}
          onChange={(e) => {
            const val = e.target.value;
            setParam3(val);
            data.onFieldChange?.(id, 'param3', val);
          }}
          style={{ width: '100%', color: 'black' }}
        />
      </div>

      <Handle type="source" position="bottom" style />
    </div>
  );
}
