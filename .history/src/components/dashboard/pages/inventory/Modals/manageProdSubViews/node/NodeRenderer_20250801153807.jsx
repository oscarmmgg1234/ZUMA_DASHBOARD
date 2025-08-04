// Updated Graph Logic for Deleting Product Node and Reconnecting

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

let id = 0;
const getId = () => `n${id++}`;

const initialNodes = [
  {
    id: getId(),
    type: 'product',
    position: { x: 0, y: 0 },
    data: { label: 'Product 1' },
  },
];

const initialEdges = [];

export default function TreeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const findNextProduct = (currentId) => {
    const currentNode = nodes.find((n) => n.id === currentId);
    const outgoingEdges = edges.filter((e) => e.source === currentId);
    return outgoingEdges
      .map((e) => nodes.find((n) => n.id === e.target && n.type === 'product'))
      .find(Boolean);
  };

  const findPreviousProduct = (currentId) => {
    const incomingEdges = edges.filter((e) => e.target === currentId);
    return incomingEdges
      .map((e) => nodes.find((n) => n.id === e.source && n.type === 'product'))
      .find(Boolean);
  };

  const getAllChildActions = (parentId, acc = []) => {
    const childEdge = edges.find((e) => e.source === parentId);
    if (!childEdge) return acc;
    const childNode = nodes.find((n) => n.id === childEdge.target);
    if (childNode && childNode.type === 'action') {
      acc.push(childNode.id);
      return getAllChildActions(childNode.id, acc);
    }
    return acc;
  };

  const onDeleteProduct = useCallback((nodeId) => {
    const childActionIds = getAllChildActions(nodeId);
    const nextProduct = findNextProduct(nodeId);
    const prevProduct = findPreviousProduct(nodeId);

    setNodes((nds) => nds.filter((n) => n.id !== nodeId && !childActionIds.includes(n.id)));
    setEdges((eds) => {
      let updated = eds.filter(
        (e) =>
          e.source !== nodeId &&
          e.target !== nodeId &&
          !childActionIds.includes(e.source) &&
          !childActionIds.includes(e.target)
      );
      if (prevProduct && nextProduct) {
        updated.push({
          id: `${prevProduct.id}-${nextProduct.id}`,
          source: prevProduct.id,
          target: nextProduct.id,
        });
      }
      return updated;
    });
  }, [nodes, edges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {/* Example Usage: Delete a node */}
      {/* <button onClick={() => onDeleteProduct('n1')}>Delete Product</button> */}
    </div>
  );
}
