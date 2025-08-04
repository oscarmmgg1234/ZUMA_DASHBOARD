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
}
const initialTree = [
  {
    id: uuidv4(),
    name: 'Product 1',
    type: 'product',
    children: []
  }
];

function buildLayout(tree, props, registryMap, handleNodeFieldChange) {
  const nodes = [];
  const edges = [];

  let xOffset = 0;

  const mainEdgeStyle = {
    stroke: '#00bcd4',
    strokeWidth: 2,
  };

  const addEdgeStyle = {
    stroke: '#888',
    strokeDasharray: '3 3'
  };

  const arrowSize = {
    width: 25,
    height: 25
  };

  for (let i = 0; i < tree.length; i++) {
    const product = tree[i];
    const productX = xOffset;
    const productY = 0;

    nodes.push({
      id: product.id,
      type: 'productNode',
      data: {
        id: product.id,
        products: props.products,
        selectedProductId: product.selectedProductId || '',
        onFieldChange: handleNodeFieldChange,
        name: product.name || ''
      },
      position: { x: productX, y: productY },
      deletable: true
    });

    // Horizontal edge: previous product → current
    if (i > 0) {
      edges.push({
        id: `e-${tree[i - 1].id}-${product.id}`,
        source: tree[i - 1].id,
        target: product.id,
        animated: true,
        style: mainEdgeStyle,
        markerEnd: {
          type: 'arrowclosed',
          color: '#00bcd4',
          ...arrowSize
        }
      });
    }

    let currentParentId = product.id;
    for (let j = 0; j < product.children.length; j++) {
      const action = product.children[j];
      const actionY = productY + 450 * (j + 1);

      nodes.push({
        id: action.id,
        type: 'actionNode',
        data: {
          route: props.route,
          registryMap,
          token: action.token,
           onFieldChange: handleNodeFieldChange
        },
        position: { x: productX, y: actionY },
        deletable: true
      });

      edges.push({
        id: `e-${currentParentId}-${action.id}`,
        source: currentParentId,
        target: action.id,
        animated: true,
        style: mainEdgeStyle,
        markerEnd: {
          type: 'arrowclosed',
          color: '#00bcd4',
          ...arrowSize
        }
      });

      currentParentId = action.id;
    }

    const addId = `${product.id}-add`;
    const addY = productY + 450 * (product.children.length + 1);
    nodes.push({
      id: addId,
      type: 'default',
      data: { label: '+ Add Action' },
      position: { x: productX, y: addY },
       style: {
    backgroundColor: '#1e1e1ed2',
    color: '#fff',
    border: '3px solid #00bcd4',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    width: 260,
    fontSize: 23
  },
      deletable: false
    });

    edges.push({
      id: `e-${currentParentId}-${addId}`,
      source: currentParentId,
      target: addId,
      animated: true,
      style: mainEdgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        color: '#00bcd4',
        ...arrowSize
      }
    });

    xOffset += 500;
  }

  const addProdId = 'add-product';
  nodes.push({
    id: addProdId,
    type: 'default',
    data: { label: '+ Add Product' },
    position: { x: xOffset, y: 0 },
     style: {
    backgroundColor: '#000000b5',
    color: '#fff',
    border: '5px solid #00bcd4',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    width: 260,
    fontSize: 23
  },
    deletable: false
  });

  if (tree.length > 0) {
    edges.push({
      id: `e-${tree[tree.length - 1].id}-${addProdId}`,
      source: tree[tree.length - 1].id,
      target: addProdId,
      animated: true,
      style: mainEdgeStyle,
      markerEnd: {
        type: 'arrowclosed',
        color: '#00bcd4',
        ...arrowSize
      }
    });
  }

  return { nodes, edges };
}





const parseTokensFromProduct = (product) => {
  const parse = (tokenStr, typeKey) => {
    if (!tokenStr) return [];

    return tokenStr.split(' ').map(entry => {
      const [type, func, id, p1, p2, p3] = entry.split(':');
      return {
        type: type?.toLowerCase() || null,
        func: func?.toLowerCase() || null,
        productId: id || product.PRODUCT_ID,
        param1: p1 || null,
        param2: p2 || null,
        param3: p3 || null
      };
    }).filter(token => !['preops', 'postops'].includes(token.type));
  };

  return {
    activation: parse(product.ACTIVATION_TOKEN, 'activation'),
    reduction: parse(product.REDUCTION_TOKEN, 'reduction'),
    shipment: parse(product.SHIPMENT_TOKEN, 'shipment')
  };
};
const buildFirstStageMap = (product) => {
  const parsed = parseTokensFromProduct(product);
  const firstStage = new Map();

  Object.entries(parsed).forEach(([category, tokens]) => {
    if (!firstStage.has(category)) firstStage.set(category, new Map());

    tokens.forEach(token => {
      const productId = token.productId;
      if (!firstStage.get(category).has(productId)) {
        firstStage.get(category).set(productId, []);
      }
      firstStage.get(category).get(productId).push(token);
    });
  });

  return firstStage;
};

const prepareRegistry = (registry) => {
  const registryMap = new Map();
  for (const item of registry) {
    const classKey = item.class;

    // Skip preops and postops
    if (classKey === 'PREOPS' || classKey === 'POSTOPS') {
      continue;
    }

    if (!registryMap.has(classKey)) {
      registryMap.set(classKey, []);
    }
    registryMap.get(classKey).push(item);
  }

  return registryMap;
};
function finalPhase(firstStage, route, allProducts) {
  const result = [];

  const productMap = firstStage.get(route);
  if (!productMap) return result;

  for (const [productId, tokens] of productMap.entries()) {

   const children = tokens.map(token => ({
  id: `action-${uuidv4()}`,
  name: token.func,
  token: token  // ✅ preserve full token object
}));


    result.push({
      id: `prod-${productId}`,
      name: `Product ${productId.slice(0, 4)}`, // or matchingProduct?.NAME
      type: 'product',
      selectedProductId: productId,
      children
    });
  }

  return result;
}


function treeToTokenEncoder(){
  // so for this we need to create a token with format "CLASSID:FUNCTIONID:PORODUCTID:PARAM1
  //work backwards
}

const commitChangesIsValid = (currentTree, snapshotTree) => {
  if (!Array.isArray(currentTree) || !Array.isArray(snapshotTree)) return false;
  if (currentTree.length !== snapshotTree.length) return false;

  const productKeys = ['selectedProductId', 'name', 'price', 'category']; // Add any product fields you track
  const tokenKeys = ['type', 'func', 'productId', 'param1', 'param2', 'param3'];

  for (let i = 0; i < currentTree.length; i++) {
    const currentProduct = currentTree[i];
    const snapshotProduct = snapshotTree[i];

    // 🔍 Compare product-level fields
    for (const key of productKeys) {
      const curVal = currentProduct[key] || '';
      const snapVal = snapshotProduct[key] || '';
      if (curVal !== snapVal) {
        console.log(`Product field changed: ${key}`);
        return false;
      }
    }

    // 🔍 Compare number of child actions
    if (currentProduct.children.length !== snapshotProduct.children.length) {
      return false;
    }

    // 🔍 Compare each child action token
    for (let j = 0; j < currentProduct.children.length; j++) {
      const curChild = currentProduct.children[j];
      const snapChild = snapshotProduct.children[j];

      const curToken = curChild.token || {};
      const snapToken = snapChild.token || {};

      for (const key of tokenKeys) {
        const curVal = curToken[key] || '';
        const snapVal = snapToken[key] || '';
        if (curVal !== snapVal) {
          console.log(`Token field changed in action ${j}: ${key}`);
          return false;
        }
      }
    }
  }

  return true; // ✅ All fields match
};

const handleCommit = (tree, treeSnapshot) => {
  const isValid = commitChangesIsValid(tree, treeSnapshot);
  console.log("current tree", tree)
  console.log("treeSnapshot",treeSnapshot )
  if (!isValid) {
    alert("Tree has been modified.");
    // Perform your commit logic here
  } else {
    alert("No changes to commit.");
  }
};


;




function FlowComponentInner({props}) {
  
  // console.log("seleted product", props.selectedProduct)
  // console.log("products", props.products)
  // console.log("route", props.route)
  // console.log("registry", props.registry)



  const [tree, setTree] = useState(initialTree);
  const [treeSnapshot, setTreeSnapshot] = useState(null)
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const registryMap = prepareRegistry(props.registry)
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
  useEffect(()=>{
      if (props.commitNodeChange === true){ // skip initial mount

  const isValid = handleCommit(tree, treeSnapshot);
  setTreeSnapshot(JSON.parse(JSON.stringify(tree)))
  console.log("Valid?", isValid);
      }
    
  }, [props.commitNodeChange])
useEffect(()=>{
  console.log("TREE CHANGED", JSON.stringify(tree, null, 2));
}, [tree])

useEffect(() => {
  if (!props.selectedProduct || !props.products || !props.route) return;

  const firstStage = buildFirstStageMap(props.selectedProduct);
  const newTree = finalPhase(firstStage, props.route, props.products);
  
  setTree(newTree);
   setTreeSnapshot((prevSnapshot) => {
    // Only set if snapshot is empty OR product changed
    const currentSnapshotProductId = prevSnapshot?.[0]?.productId || '';
    if (props.selectedProduct.PRODUCT_ID !== currentSnapshotProductId) {
      return JSON.parse(JSON.stringify(newTree)); // deep clone
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
      setTree(prev => {
        const newTree = [...prev];
        newTree.push({ id: newProdId, name: 'New Product', type: 'product', children: [] });
        return newTree;
      });
    } else if (node.data.label === '+ Add Action') {
      setTree(prev => {
        const newTree = prev.map(product => {
          if (`${product.id}-add` === node.id) {
            return {
              ...product,
              children: [...product.children, { id: uuidv4(), name: 'New Action' }]
            };
          }
          return product;
        });
        return newTree;
      });
    }
  }, []);

const onKeyDown = useCallback((e) => {
  const tag = e.target.tagName.toLowerCase();
  const isEditable = ['input', 'textarea'].includes(tag) || e.target.isContentEditable;

  if (isEditable) return; // ❌ ignore when editing input

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
  {/* Save Button */}
  <button
    onClick={() => {
      const isValid = handleCommit(tree, treeSnapshot);
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

  {/* React Flow Canvas */}
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