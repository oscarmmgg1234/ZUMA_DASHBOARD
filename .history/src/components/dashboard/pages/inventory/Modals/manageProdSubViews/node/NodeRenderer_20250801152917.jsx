import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import { hierarchy, tree as d3tree } from 'd3-hierarchy';
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
          type: 'add-action',
          id: uuidv4(),
          children: []
        }
      ]
    }
  ]
};

function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

function ensureActionDummies(node) {
  if (!node.children) node.children = [];

  const hasAdd = node.children.some(c => c.type === 'add-action');
  const realChildren = node.children.filter(c => c.type === 'action');

  if (!hasAdd) {
    node.children.push({
      name: '+ Add Action',
      id: uuidv4(),
      type: 'add-action',
      children: []
    });
  }

  realChildren.forEach(ensureActionDummies);
}

function checkIdle(tree) {
  const newTree = cloneTree(tree);

  for (const child of newTree.children || []) {
    if (child.type === 'product') {
      ensureActionDummies(child);
    }
  }

  const hasAddProduct = newTree.children.some(c => c.type === 'add-product');
  if (!hasAddProduct) {
    newTree.children.push({
      name: '+ Add Product',
      id: uuidv4(),
      type: 'add-product',
      children: []
    });
  }

  return newTree;
}

function buildReactFlowFromTree(treeData) {
  const root = hierarchy(treeData);
  const layout = d3tree().nodeSize([200, 100]);
  layout(root);

  const nodes = root.descendants()
    .filter(d => d.data.type)
    .map(d => ({
      id: d.data.id,
      type: d.data.type,
      data: { label: d.data.name },
      position: { x: d.x, y: d.y },
      deletable: !d.data.type.includes('add')
    }));

  const edges = root.links().map(link => ({
    id: `e-${link.source.data.id}-${link.target.data.id}`,
    source: link.source.data.id,
    target: link.target.data.id,
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
  }, [tree]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selected = rfNodes.find(n => n.selected);
      if (selected && selected.deletable) {
        const updated = deleteNode(tree, selected.id);
        const checked = checkIdle(updated);
        setTree(checked);
      }
    }
  }, [rfNodes, tree]);

  const deleteNode = (node, id) => {
    if (!node.children) return node;
    node.children = node.children.filter((child, index) => {
      if (child.id === id) {
        const grandChildren = child.children || [];
        node.children.splice(index + 1, 0, ...grandChildren);
        return false;
      }
      return true;
    }).map(child => deleteNode(child, id));
    return node;
  };

  const onNodeClick = useCallback((event, node) => {
    const newTree = cloneTree(tree);

    function insertAction(nodeObj) {
      if (!nodeObj.children) return;

      nodeObj.children = nodeObj.children.flatMap(child => {
        if (child.id === node.id && child.type === 'add-action') {
          const newAction = {
            name: 'New Action',
            id: uuidv4(),
            type: 'action',
            children: []
          };
          return [newAction];
        } else {
          insertAction(child);
          return [child];
        }
      });
    }

    if (node.type === 'add-product') {
      newTree.children = newTree.children.filter(c => c.id !== node.id);
      newTree.children.push({
        name: 'New Product',
        id: uuidv4(),
        type: 'product',
        children: [
          {
            name: '+ Add Action',
            id: uuidv4(),
            type: 'add-action',
            children: []
          }
        ]
      });
    } else if (node.type === 'add-action') {
      newTree.children.forEach(insertAction);
    }

    const checked = checkIdle(newTree);
    setTree(checked);
  }, [tree]);

  return (
    <div style={{ width: '100vw', height: '100vh' }} onKeyDown={handleKeyDown} tabIndex={0}>
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