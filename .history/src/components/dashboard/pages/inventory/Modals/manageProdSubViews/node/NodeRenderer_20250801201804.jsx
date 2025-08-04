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
    nodes.push({
      id: product.id,
      type: 'productNode',
      data: {   id: product.id,
    products: props.products,
    selectedProductId: product.selectedProductId || '',
      },
      position: { x: productX, y: productY },
      deletable: true
    });

    if (i > 0) {
      edges.push({
        id: `e-${tree[i - 1].id}-${product.id}`,
        source: tree[i - 1].id,
        target: product.id
      });
    }

    let currentParentId = product.id;
    for (let j = 0; j < product.children.length; j++) {
      const action = product.children[j];
      console.log("Creating action node with token:", action.token);

      const actionY = productY + 150 * (j + 1);
      nodes.push({
        id: action.id,
        type: 'actionNode',
        data: {
    route: props.route, // e.g., "activation"
    registryMap,
    token: action.token  // from prepareRegistry
  },
        position: { x: productX, y: actionY },
        deletable: true
      });
      edges.push({
        id: `e-${currentParentId}-${action.id}`,
        source: currentParentId,
        target: action.id
      });
      currentParentId = action.id;
    }

    const addId = `${product.id}-add`;
    nodes.push({
      id: addId,
      type: 'default',
      data: { label: '+ Add Action' },
      position: { x: productX, y: productY + 150 * (product.children.length + 1) },
      deletable: false
    });
    edges.push({
      id: `e-${currentParentId}-${addId}`,
      source: currentParentId,
      target: addId
    });

    xOffset += 300;
  }

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
        productId: id?.toLowerCase() || product.PRODUCT_ID.toLowerCase(),
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

  const productMap = firstStage.get(route.toLowerCase());
  if (!productMap) return result;

  for (const [productId, tokens] of productMap.entries()) {
    const matchingProduct = allProducts.find(
      p => p.PRODUCT_ID.toLowerCase() === productId
    );

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
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const registryMap = prepareRegistry(props.registry)
useEffect(() => {
  if (!props.selectedProduct || !props.products || !props.route) return;

  const firstStage = buildFirstStageMap(props.selectedProduct);
  const newTree = finalPhase(firstStage, props.route, props.products);
  console.log(newTree)

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
    <div style={{ width: '95%', height: '500px', borderStyle: "solid", borderWidth: "1px", borderRadius: 4 }} tabIndex={0} onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodesDraggable={true}
        nodeTypes={nodeTypes}
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