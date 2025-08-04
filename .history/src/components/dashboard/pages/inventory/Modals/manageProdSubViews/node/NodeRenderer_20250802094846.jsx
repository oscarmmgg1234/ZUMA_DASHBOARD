import React, { useState, useCallback, useEffect } from 'react';
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

function buildLayout(tree, props, registryMap) {
  const nodes = [];
  const edges = [];

  let xOffset = 0;

  for (let i = 0; i < tree.length; i++) {
    const product = tree[i];
    const productX = xOffset;
    const productY = 0;

    // Product node
    nodes.push({
      id: product.id,
      type: 'productNode',
      data: {
        id: product.id,
        products: props.products,
        selectedProductId: product.selectedProductId || '',
      },
      position: { x: productX, y: productY },
      deletable: true
    });

    // Horizontal edge: previous product → current
    if (i > 0) {
      edges.push({
        id: `e-${tree[i - 1].id}-${product.id}`,
        source: tree[i - 1].id,
        target: product.id
      });
    }

    // Vertically chain action nodes
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
          token: action.token // ✅ Keep this for field prefill
        },
        position: { x: productX, y: actionY },
        deletable: true
      });

      // Chain: previous node → this action
      edges.push({
        id: `e-${currentParentId}-${action.id}`,
        source: currentParentId,
        target: action.id
      });

      currentParentId = action.id;
    }

    // + Add Action node at end of action chain
    const addId = `${product.id}-add`;
    const addY = productY + 450 * (product.children.length + 1);
    nodes.push({
      id: addId,
      type: 'default',
      data: { label: '+ Add Action' },
      position: { x: productX, y: addY },
      deletable: false
    });

    // Link last action → +Add Action
    edges.push({
      id: `e-${currentParentId}-${addId}`,
      source: currentParentId,
      target: addId
    });

    xOffset += 500; // move horizontally for next product
  }

  // + Add Product node at end
  const addProdId = 'add-product';
  nodes.push({
    id: addProdId,
    type: 'default',
    data: { label: '+ Add Product' },
    position: { x: xOffset, y: 0 },
    deletable: false
  });

  if (tree.length > 0) {
    edges.push({
      id: `e-${tree[tree.length - 1].id}-${addProdId}`,
      source: tree[tree.length - 1].id,
      target: addProdId
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
  
useEffect(() => {
  if (!props.selectedProduct || !props.products || !props.route) return;

  const firstStage = buildFirstStageMap(props.selectedProduct);
  const newTree = finalPhase(firstStage, props.route, props.products);
  const routes = ['activation', 'reduction','shipment']
  setTree(newTree);
}, [props.selectedProduct, props.route, props.products]);



  useEffect(() => {
    const { nodes, edges } = buildLayout(tree, props, registryMap);
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
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selected = rfNodes.find(n => n.selected && n.deletable);
      if (!selected) return;
      const id = selected.id;

      setTree(prev => {
        const productIndex = prev.findIndex(p => p.id === id);
        if (productIndex !== -1) {
          const prevNode = prev[productIndex - 1];
          const nextNode = prev[productIndex + 1];
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
    <div style={{ width: '95%', height: '1000px', borderStyle: "solid", borderWidth: "3px", borderRadius: 4, borderColor:"rgba(0,0,0,.3)" }} tabIndex={0} onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
        fitView
      >
        <MiniMap/>
        <Background />
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