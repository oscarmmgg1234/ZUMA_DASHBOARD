import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import { hierarchy, tree } from 'd3-hierarchy';
import { v4 as uuidv4 } from 'uuid';
import 'reactflow/dist/style.css';

const initialTree = {
  name: 'root',
  children: [
    {
      name: 'Product 1',
      type: 'product',
      id: uuidv4(),
      children: [
        {
          name: '+ Add Action',
          type: 'add',
          id: uuidv4(),
          children: []
        }
      ]
    }
  ]
};

function deleteAndShiftUp(treeNode, targetId) {
  if (!treeNode.children) return treeNode;

  let newChildren = [];
  for (let i = 0; i < treeNode.children.length; i++) {
    const child = treeNode.children[i];
    if (child.id === targetId) {
      const prev = treeNode.children[i - 1];
      const next = treeNode.children[i + 1];

      if (prev && next) {
        prev.children = [...(prev.children || []), next];
      }
      // Skip this node (delete it)
      continue;
    } else {
      const updatedChild = deleteAndShiftUp(child, targetId);
      newChildren.push(updatedChild);
    }
  }

  treeNode.children = newChildren;
  return treeNode;
}

function checkIdle(tree) {
  function recurse(node) {
    if (!node.children) node.children = [];

    const hasActionDummy = node.children.some(c => c.type === 'add');
    if ((node.type === 'product' || node.type === 'action') && !hasActionDummy) {
      node.children.push({
        name: '+ Add Action',
        id: uuidv4(),
        type: 'add',
        children: []
      });
    }

    node.children.forEach(recurse);
  }

  const newTree = structuredClone(tree);
  if (!newTree.children) newTree.children = [];

  const productNodes = newTree.children.filter(c => c.type === 'product');
  const hasProductDummy = newTree.children.some(c => c.type === 'add-product');

  if (!hasProductDummy) {
    newTree.children.push({
      name: '+ Add Product',
      id: uuidv4(),
      type: 'add-product',
      children: []
    });
  }

  productNodes.forEach(recurse);
  return newTree;
}

function reconnectProducts(tree) {
  if (!tree.children || tree.children.length < 2) return [];
  const productNodes = tree.children.filter(c => c.type === 'product');
  const edges = [];
  for (let i = 0; i < productNodes.length - 1; i++) {
    edges.push({
      id: `e-${productNodes[i].id}-${productNodes[i + 1].id}`,
      source: productNodes[i].id,
      target: productNodes[i + 1].id,
      sourceHandle: 'output-main',
      targetHandle: 'input-main'
    });
  }
  return edges;
}

function buildReactFlowFromTree(treeData) {
  const root = hierarchy(treeData);
  const layout = tree().nodeSize([250, 150]);
  layout(root);

  const nodes = root.descendants()
    .filter(d => d.data.type)
    .map(d => ({
      id: d.data.id,
      type: d.data.type,
      data: { label: d.data.name },
      position: { x: d.x, y: d.y },
      deletable: d.data.type !== 'add' && d.data.type !== 'add-product'
    }));

  const edges = [
    ...root.links().map(link => ({
      id: `e-${link.source.data.id}-${link.target.data.id}`,
      source: link.source.data.id,
      target: link.target.data.id,
      sourceHandle: 'output-main',
      targetHandle: link.target.data.type.includes('action') ? 'subinput-main' : 'input-main'
    })),
    ...reconnectProducts(treeData)
  ];

  return { nodes, edges };
}

function FlowComponentInner() {
  const [tree, setTree] = useState(() => checkIdle(initialTree));
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const { nodes, edges } = buildReactFlowFromTree(tree);
    setNodes(nodes);
    setEdges(edges);
  }, [tree, setNodes, setEdges]);

  const handleDelete = useCallback((nodeId) => {
    const updated = deleteAndShiftUp(structuredClone(tree), nodeId);
    const checked = checkIdle(updated);
    setTree(checked);
  }, [tree]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selected = rfNodes.find(n => n.selected);
      if (selected && selected.deletable) {
        handleDelete(selected.id);
      }
    }
  }, [rfNodes, handleDelete]);

  const onNodeClick = useCallback((event, node) => {
    const updatedTree = structuredClone(tree);

    function replaceNodeRecursive(current) {
      if (!current.children) return current;
      current.children = current.children.map(child => {
        if (child.id === node.id && node.type === 'add') {
          return {
            name: 'New Action',
            id: uuidv4(),
            type: 'action',
            children: []
          };
        }
        return replaceNodeRecursive(child);
      });
      return current;
    }

    if (node.type === 'add') {
      replaceNodeRecursive(updatedTree);
    } else if (node.type === 'add-product') {
      updatedTree.children = updatedTree.children.filter(n => n.id !== node.id);
      updatedTree.children.push({
        name: 'New Product',
        id: uuidv4(),
        type: 'product',
        children: [
          {
            name: '+ Add Action',
            id: uuidv4(),
            type: 'add',
            children: []
          }
        ]
      });
    }

    const checked = checkIdle(updatedTree);
    setTree(checked);
  }, [tree]);

  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function FlowComponent() {
  return (
    <ReactFlowProvider>
      <FlowComponentInner />
    </ReactFlowProvider>
  );
}

