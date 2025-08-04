import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import 'reactflow/dist/style.css';
import ProductNode from './nodes/ProductNode';
import ActionNode from './nodes/ActionNode';

const nodeTypes = {
  productNode: ProductNode,
  actionNode: ActionNode
};

const initialTree = [
  {
    id: uuidv4(),
    name: 'Product 1',
    type: 'product',
    children: []
  }
];

function FlowComponentInner({ props }) {
  const [tree, setTree] = useState(initialTree);
  const [treeSnapshot, setTreeSnapshot] = useState(null);
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const [notification, setNotification] = useState(null);
  const registryMap = prepareRegistry(props.registry);

  const handleNodeFieldChange = (nodeId, field, value) => {
    setTree(prevTree => {
      return prevTree.map(product => {
        if (product.id === nodeId) {
          return {
            ...product,
            [field]: value
          };
        }

        const updatedChildren = product.children.map(child => {
          if (child.id === nodeId) {
            return {
              ...child,
              token: {
                ...child.token,
                [field]: value
              }
            };
          }
          return child;
        });

        return {
          ...product,
          children: updatedChildren
        };
      });
    });
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCommit = (tree, treeSnapshot, route) => {
    const isValid = commitChangesIsValid(tree, treeSnapshot);
    const updatedToken = treeToTokenEncoder(tree, route);
    console.log("updated token", updatedToken);

    if (!isValid) {
      showNotification("Token updated for this component.");
    } else {
      showNotification("Nothing has changed.");
    }
    return isValid;
  };

  useEffect(() => {
    if (props.commitNodeChange === true) {
      const isValid = handleCommit(tree, treeSnapshot, props.route);
      setTreeSnapshot(JSON.parse(JSON.stringify(tree)));
    }
  }, [props.commitNodeChange]);

  useEffect(() => {
    if (!props.selectedProduct || !props.products || !props.route) return;
    const firstStage = buildFirstStageMap(props.selectedProduct);
    const newTree = finalPhase(firstStage, props.route, props.products);
    setTree(newTree);
    setTreeSnapshot((prevSnapshot) => {
      const currentSnapshotProductId = prevSnapshot?.[0]?.productId || '';
      if (props.selectedProduct.PRODUCT_ID !== currentSnapshotProductId) {
        return JSON.parse(JSON.stringify(newTree));
      }
      return prevSnapshot;
    });
  }, [props.selectedProduct, props.route, props.products]);

  useEffect(() => {
    const { nodes, edges } = buildLayout(tree, props, registryMap, handleNodeFieldChange);
    setNodes(nodes);
    setEdges(edges);
  }, [tree]);

  const onNodeClick = useCallback((_, node) => {
    if (node.data.label === '+ Add Product') {
      const newProdId = uuidv4();
      setTree(prev => [...prev, { id: newProdId, name: 'New Product', type: 'product', children: [] }]);
    } else if (node.data.label === '+ Add Action') {
      setTree(prev => prev.map(product => {
        if (`${product.id}-add` === node.id) {
          return {
            ...product,
            children: [...product.children, { id: uuidv4(), name: 'New Action' }]
          };
        }
        return product;
      }));
    }
  }, []);

  const onKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase();
    if (['input', 'textarea'].includes(tag) || e.target.isContentEditable) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selected = rfNodes.find(n => n.selected && n.deletable);
      if (!selected) return;

      const id = selected.id;
      setTree(prev => {
        const productIndex = prev.findIndex(p => p.id === id);
        if (productIndex !== -1) {
          const newTree = [...prev];
          newTree.splice(productIndex, 1);
          return newTree;
        }
        return prev.map(product => ({
          ...product,
          children: product.children.filter(c => c.id !== id)
        }));
      });
    }
  }, [rfNodes]);

  return (
    <div style={{ position: 'relative', width: '95%', height: '800px', borderStyle: "solid", borderWidth: "7px", borderColor: "rgba(0, 28, 62, 0.75)", borderRadius: "10px" }} tabIndex={0} onKeyDown={onKeyDown}>
      {notification && (
        <div style={{
          position: 'absolute',
          top: 15,
          left: 25,
          zIndex: 1000,
          background: '#00bcd4',
          color: '#000',
          padding: '10px 20px',
          borderRadius: '12px',
          fontWeight: 'bold',
          boxShadow: '0px 4px 8px rgba(0,0,0,0.3)'
        }}>
          {notification}
        </div>
      )}

      <button
        onClick={() => {
          const isValid = handleCommit(tree, treeSnapshot, props.route);
          if (!isValid) {
            setTreeSnapshot(JSON.parse(JSON.stringify(tree)));
          }
        }}
        style={{
          position: 'absolute',
          top: 15,
          right: 25,
          zIndex: 1000,
          padding: '12px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(145deg, #2f2f2f, #3e3e3e)',
          border: '3px solid #00bcd4',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0px 4px 8px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1.0)')}
      >
        Save Changes
      </button>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        style={{ width: '100%', height: '100%', backgroundColor: '#3e5778d4' }}
        fitView
      >
        <MiniMap />
        <Background variant="dots" gap={16} size={5} color="#4f4c4cf5" style={{ opacity: 0.4 }} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function FlowComponent(props) {
  return (
    <ReactFlowProvider>
      <FlowComponentInner props={props} />
    </ReactFlowProvider>
  );
}
