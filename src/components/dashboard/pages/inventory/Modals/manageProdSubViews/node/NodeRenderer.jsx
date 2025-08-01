// GrowGraph.jsx
import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

/* ───── Node Types ───── */

function ProductNode({ data }) {
  return (
    <div className="bg-green-600 text-white p-3 rounded shadow min-w-[120px]">
      <div className="text-sm font-bold">Product</div>
      <div className="text-xs">{data.label}</div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}

function ActionNode({ data }) {
  return (
    <div className="bg-blue-600 text-white p-3 rounded shadow min-w-[120px]">
      <div className="text-sm font-bold">Action</div>
      <div className="text-xs">{data.label}</div>
      <Handle type="target" position={Position.Top} id="in" />
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}

function PlaceholderNode({ data }) {
  return (
    <div
      onClick={() => data.onAdd(data)}
      className="border-2 border-dashed border-gray-400 text-gray-500 flex items-center justify-center w-24 h-12 rounded cursor-pointer hover:bg-gray-100"
    >
      +
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = {
  product: ProductNode,
  action: ActionNode,
  placeholder: PlaceholderNode,
};

/* ───── Main Graph ───── */

export default function GrowGraph() {
  const idRef = useRef(1);
  const nextId = () => `n${++idRef.current}`;

  const [nodes, setNodes] = useState([
    {
      id: 'n1',
      type: 'product',
      position: { x: 100, y: 100 },
      data: { label: 'Product 1' },
    },
    {
      id: 'ph-n1',
      type: 'placeholder',
      position: { x: 300, y: 100 },
      data: { onAdd, parentId: 'n1', direction: 'right' },
    },
  ]);

  const [edges, setEdges] = useState([]);

 

   


  const onNodesChange = useCallback((c) => setNodes((nds) => applyNodeChanges(c, nds)), []);
  const onEdgesChange = useCallback((c) => setEdges((eds) => applyEdgeChanges(c, eds)), []);
  const onConnect = useCallback((p) => setEdges((eds) => addEdge(p, eds)), []);

  return (
    <div style={{ height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
