import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
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
      children: []
    }
  ]
};

function deleteAndShiftUp(treeNode, targetId) {
  if (!treeNode.children) return treeNode;

  treeNode.children = treeNode.children.filter((child, i) => {
    if (child.id === targetId) {
      const next = treeNode.children[i + 1];
      if (next) {
        child.children.forEach(grandChild => next.children.push(grandChild));
      }
      return false;
    }
    deleteAndShiftUp(child, targetId);
    return true;
  });

  return treeNode;
}

function checkIdle(tree) {
  const newTree = structuredClone(tree);

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

  for (const product of productNodes) {
    if (!product.children || product.children.length === 0) {
      product.children = [{
        name: '+ Add Action',
        id: uuidv4(),
        type: 'add',
        children: []
      }];
    } else {
      let current = product;
      while (current.children && current.children.length > 0) {
        const next = current.children[current.children.length - 1];
        if (next.type === 'add') break;
        current = next;
      }

      const last = current.children[current.children.length - 1];
      if (!last || last.type !== 'add') {
        current.children.push({
          name: '+ Add Action',
          id: uuidv4(),
          type: 'add',
          children: []
        });
      }
    }
  }

  return newTree;
}

function buildReactFlowFromTree(treeData) {
  const root = hierarchy(treeData);
  const layout = tree().nodeSize([150, 100]);
  layout(root);

  // manually place top-level product nodes horizontally
  const productNodes = root.children.filter(n => n.data.type === 'product');
  productNodes.forEach((node, idx) => {
    node.x = idx * 300;
    node.y = 50;
  });

  const nodes = root.descendants().filter(d => d.data.type).map(d => ({
    id: d.data.id,
    type: d.data.type,
    data: { label: d.data.name },
    position: { x: d.x, y: d.y },
    deletable: d.data.type !== 'add' && d.data.type !== 'add-product'
  }));

  const edges = root.links().map(link => ({
    id: `e-${link.source.data.id}-${link.target.data.id}`,
    source: link.source.data.id,
    target: link.target.data.id,
    sourceHandle: 'output-main',
    targetHandle: 'input-main'
  }));

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
      if (!current.children) return;

      current.children = current.children.map(child => {
        if (child.id === node.id && node.type === 'add') {
          return {
            name: 'New Action',
            id: uuidv4(),
            type: 'action',
            children: []
          };
        }
        replaceNodeRecursive(child);
        return child;
      });
    }

    if (node.type === 'add') {
      replaceNodeRecursive(updatedTree);
    } else if (node.type === 'add-product') {
      updatedTree.children = updatedTree.children.filter(n => n.id !== node.id);
      updatedTree.children.push({
        name: 'New Product',
        id: uuidv4(),
        type: 'product',
        children: []
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

