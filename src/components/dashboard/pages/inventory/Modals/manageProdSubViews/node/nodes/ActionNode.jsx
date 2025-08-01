// components/nodes/ActionNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

export function ActionNode({ data }) {
  return (
    <div className="bg-blue-600 text-white p-3 rounded shadow-md min-w-[120px]">
      <div className="font-bold text-sm">Action</div>
      <div className="text-xs">{data.label}</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}