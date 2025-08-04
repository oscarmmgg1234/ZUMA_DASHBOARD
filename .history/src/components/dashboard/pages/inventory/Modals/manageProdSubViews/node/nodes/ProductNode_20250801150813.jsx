import React from 'react';
import { Handle, Position } from 'reactflow';

export function ProductNode({ data }) {
  return (
    <div className="bg-green-700 text-white p-3 rounded shadow-md min-w-[120px]">
      <div className="font-bold text-sm">Product</div>
      <div className="text-xs">{data.label}</div>
      <Handle type="target" position={Position.Left} />
       <Handle type="source" postiion={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}