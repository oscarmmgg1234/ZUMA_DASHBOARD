import React, { useState, useEffect } from 'react';
import { Handle } from 'reactflow';


const classOptionsMap = {
  activation: ['AC', 'UP', 'RD'],
  reduction: ['CM', 'CMUP'],
  shipment: ['SH', 'UP', 'CMUP']
};

export default function ActionNode({ data, selected, id }) {
const [selectedClass, setSelectedClass] = useState(data.token?.type || '');
const [selectedFunctionId, setSelectedFunctionId] = useState(data.token?.func || '');
const [param1, setParam1] = useState(data.token?.param1 || '');
const [param2, setParam2] = useState(data.token?.param2 || '');
const [param3, setParam3] = useState(data.token?.param3 || '');


  const availableClasses = classOptionsMap[data.route?.toLowerCase()] || [];
  const availableFunctions = selectedClass && data.registryMap.get(selectedClass) || [];
  const selectedFunction = availableFunctions.find(fn => fn.id === selectedFunctionId);

  useEffect(() => {
    setSelectedFunctionId('');
  }, [selectedClass]);

  return (
    <div style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4, background: 'white', width: 250 }}>
      <Handle type="target" position="top" />
      
      <div><strong>Action Node</strong></div>

      <label style={{color: "black"}}>Class:</label>
      <select
      style={{color: "black"}}
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
      >
        <option value="">-- Select Class --</option>
        {availableClasses.map(cls => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>

      
        <>
          <label style={{ marginTop: 6,color: "black" }}>Function:</label>
          <select
          style={{color: "black"}}
            value={selectedFunctionId}
            onChange={(e) => setSelectedFunctionId(e.target.value)}
          >
            <option value="">-- Select Function --</option>
            {availableFunctions.map(fn => (
              <option key={fn.id} value={fn.id}>{fn.name}</option>
            ))}
          </select>
        </>
      

      {selectedFunction && (
        <div style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic', color: "black" }}>
          {selectedFunction.desc}
        </div>
      )}

      <div style={{ marginTop: 6 }}>
        <input
          type="text"
          placeholder="Param 1"
          value={param1}
          onChange={(e) => setParam1(e.target.value)}
          style={{ width: '100%', marginBottom: 4 ,style={{color: "black"}}}}
        />
        <input
          type="text"
          placeholder="Param 2"
          value={param2}
          onChange={(e) => setParam2(e.target.value)}
          style={{ width: '100%', marginBottom: 4 }}
        />
        <input
          type="text"
          placeholder="Param 3"
          value={param3}
          onChange={(e) => setParam3(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <Handle type="source" position="bottom" />
    </div>
  );
}
