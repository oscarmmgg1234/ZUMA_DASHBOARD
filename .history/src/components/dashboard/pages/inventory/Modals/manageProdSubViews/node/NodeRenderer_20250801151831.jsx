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

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const addPlaceholder = (parentId, position, direction) => {
    const id = `ph-${parentId}-${direction}`;
    return {
      id,
      type: 'placeholder',
      position,
      data: {
        parentId,
        direction,
        onAdd,
      },
    };
  };

  const onAdd = useCallback(({ parentId, direction }) => {
    const newId = nextId();
    const isProduct = direction === 'right';

    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    const newPosition = {
      x: parentNode.position.x + (isProduct ? 200 : 0),
      y: parentNode.position.y + (isProduct ? 0 : 150),
    };

    const newNode = {
      id: newId,
      type: isProduct ? 'product' : 'action',
      position: newPosition,
      data: { label: isProduct ? 'New Product' : 'New Action' },
    };

    const newEdge = {
      id: `e-${parentId}-${newId}`,
      source: parentId,
      target: newId,
      sourceHandle: isProduct ? 'output' : 'out',
      targetHandle: isProduct ? 'input' : 'in',
    };

    const newPlaceholder = addPlaceholder(newId, {
      x: newPosition.x + (isProduct ? 200 : 0),
      y: newPosition.y + (isProduct ? 0 : 150),
    }, direction);

    // Remove old placeholder
    setNodes((nds) => [
      ...nds.filter((n) => n.id !== `ph-${parentId}-${direction}`),
      newNode,
      newPlaceholder,
    ]);
    setEdges((eds) => [...eds, newEdge]);
  }, [nodes]);

  const onNodesChange = useCallback((c) => setNodes((nds) => applyNodeChanges(c, nds)), []);
  const onEdgesChange = useCallback((c) => setEdges((eds) => applyEdgeChanges(c, eds)), []);
  const onConnect = useCallback((p) => setEdges((eds) => addEdge(p, eds)), []);

  // Initial mount
  useState(() => {
    const rootId = 'n1';
    const root = {
      id: rootId,
      type: 'product',
      position: { x: 100, y: 100 },
      data: { label: 'Product 1' },
    };

    const initialPlaceholder = {
      id: `ph-${rootId}-right`,
      type: 'placeholder',
      position: { x: 300, y: 100 },
      data: { onAdd, parentId: rootId, direction: 'right' },
    };

    setNodes([root, initialPlaceholder]);
  });

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
