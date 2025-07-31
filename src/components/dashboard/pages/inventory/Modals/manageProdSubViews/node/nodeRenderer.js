
import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodes = [
  {
    id: '1',
    type: 'input',
    position: { x: 50, y: 50 },
    data: { label: 'Start Node' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 150 },
    data: { label: 'Middle Node' },
  },
  {
    id: '3',
    type: 'output',
    position: { x: 450, y: 250 },
    data: { label: 'End Node' },
  },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
];

export default function XYZFlow() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
