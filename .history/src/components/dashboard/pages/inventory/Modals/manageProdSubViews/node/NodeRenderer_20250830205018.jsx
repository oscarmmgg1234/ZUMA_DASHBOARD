import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import ReactFlow, {
  MiniMap,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import "reactflow/dist/style.css";
import ProductNode from "./nodes/ProductNode";
import ActionNode from "./nodes/ActionNode";
import http_handler from "../../../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

const nodeTypes = {
  productNode: ProductNode,
  actionNode: ActionNode,
};

const initialTree = [
  {
    id: uuidv4(),
    name: "Product 1",
    type: "product",
    children: [],
  },
];

function buildLayout(tree, props, registryMap, handleNodeFieldChange) {
  const nodes = [];
  const edges = [];
  let xOffset = 0;

  const mainEdgeStyle = { stroke: "#00bcd4", strokeWidth: 2 };
  const arrowSize = { width: 25, height: 25 };

  for (let i = 0; i < tree.length; i++) {
    const product = tree[i];
    const productX = xOffset;
    const productY = 0;

    nodes.push({
      id: product.id,
      type: "productNode",
      data: {
        id: product.id,
        products: props.products,
        selectedProductId: product.selectedProductId || "",
        onFieldChange: handleNodeFieldChange,
        name: product.name || "",
      },
      position: { x: productX, y: productY },
      deletable: true,
    });

    if (i > 0) {
      edges.push({
        id: `e-${tree[i - 1].id}-${product.id}`,
        source: tree[i - 1].id,
        target: product.id,
        animated: true,
        style: mainEdgeStyle,
        markerEnd: { type: "arrowclosed", color: "#00bcd4", ...arrowSize },
      });
    }

    let currentParentId = product.id;
    for (let j = 0; j < product.children.length; j++) {
      const action = product.children[j];
      const actionY = productY + 450 * (j + 1);

      nodes.push({
        id: action.id,
        type: "actionNode",
        data: {
          route: props.route,
          registryMap,
          token: action.token,
          onFieldChange: handleNodeFieldChange,
        },
        position: { x: productX, y: actionY },
        deletable: true,
      });

      edges.push({
        id: `e-${currentParentId}-${action.id}`,
        source: currentParentId,
        target: action.id,
        animated: true,
        style: mainEdgeStyle,
        markerEnd: { type: "arrowclosed", color: "#00bcd4", ...arrowSize },
      });

      currentParentId = action.id;
    }

    const addId = `${product.id}-add`;
    const addY = productY + 450 * (product.children.length + 1);
    nodes.push({
      id: addId,
      type: "default",
      data: { label: "+ Add Action" },
      position: { x: productX, y: addY },
      style: {
        backgroundColor: "#1e1e1ed2",
        color: "#fff",
        border: "3px solid #00bcd4",
        borderRadius: 8,
        padding: 10,
        fontSize: 23,
        width: 260,
      },
      deletable: false,
    });

    edges.push({
      id: `e-${currentParentId}-${addId}`,
      source: currentParentId,
      target: addId,
      animated: true,
      style: mainEdgeStyle,
      markerEnd: { type: "arrowclosed", color: "#00bcd4", ...arrowSize },
    });

    xOffset += 500;
  }

  const addProdId = "add-product";
  nodes.push({
    id: addProdId,
    type: "default",
    data: { label: "+ Add Product" },
    position: { x: xOffset, y: 0 },
    style: {
      backgroundColor: "#000000b5",
      color: "#fff",
      border: "5px solid #00bcd4",
      borderRadius: 8,
      padding: 10,
      fontSize: 23,
      width: 260,
    },
    deletable: false,
  });

  if (tree.length > 0) {
    edges.push({
      id: `e-${tree[tree.length - 1].id}-${addProdId}`,
      source: tree[tree.length - 1].id,
      target: addProdId,
      animated: true,
      style: mainEdgeStyle,
      markerEnd: { type: "arrowclosed", color: "#00bcd4", ...arrowSize },
    });
  }

  return { nodes, edges };
}

/* -------------------- TOKEN PARSING (pure) -------------------- */
const parseTokenString = (tokenStr, fallbackProductId) => {
  if (!tokenStr) return [];
  return tokenStr
    .trim()
    .split(/\s+/)
    .map((entry) => {
      const [type, func, id, p1, p2, p3] = entry.split(":");
      return {
        type: type?.toLowerCase() || null,
        func: func || null,
        productId: id || fallbackProductId,
        param1: p1 ?? null,
        param2: p2 ?? null,
        param3: p3 ?? null,
      };
    })
    .filter((t) => !["preops", "postops", "virtualops"].includes(t.type));
};

const parseTokensFromProduct = (product, cleaned /* {activation,reduction,shipment} */) => {
  const act = (cleaned?.activation ?? product?.ACTIVATION_TOKEN ?? "").trim();
  const red = (cleaned?.reduction  ?? product?.REDUCTION_TOKEN  ?? "").trim();
  const shp = (cleaned?.shipment   ?? product?.SHIPMENT_TOKEN   ?? "").trim();
  return {
    activation: parseTokenString(act, product.PRODUCT_ID),
    reduction:  parseTokenString(red, product.PRODUCT_ID),
    shipment:   parseTokenString(shp, product.PRODUCT_ID),
  };
};
/* -------------------------------------------------------------- */

const buildFirstStageMapFromParsed = (product, parsed) => {
  const firstStage = new Map();
  Object.entries(parsed).forEach(([category, tokens]) => {
    if (!firstStage.has(category)) firstStage.set(category, new Map());
    tokens.forEach((token) => {
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
    if (classKey === "PREOPS" || classKey === "POSTOPS" || classKey === "VIRTUALOPS") continue;
    if (!registryMap.has(classKey)) registryMap.set(classKey, []);
    registryMap.get(classKey).push(item);
  }
  return registryMap;
};

function finalPhase(firstStage, route) {
  const result = [];
  const productMap = firstStage.get(route);
  if (!productMap) return result;

  for (const [productId, tokens] of productMap.entries()) {
    const children = tokens.map((token) => ({
      id: `action-${uuidv4()}`,
      name: token.func,
      token,
    }));

    result.push({
      id: `prod-${productId}`,
      name: `Product ${productId.slice(0, 4)}`,
      type: "product",
      selectedProductId: productId,
      children,
    });
  }
  return result;
}

function treeToTokenEncoder(tree) {
  const tokens = [];
  for (const product of tree) {
    if (!product.selectedProductId || !Array.isArray(product.children)) continue;
    for (const action of product.children) {
      const t = action.token || {};
      const classId = t.type?.toUpperCase();
      const funcId = t.func;
      const productId = product.selectedProductId;
      if (!classId || !funcId || !productId) continue;
      const parts = [classId, funcId, productId];
      [t.param1, t.param2, t.param3].forEach((p) => {
        if (p !== undefined && p !== null && p !== "") parts.push(p);
      });
      tokens.push(parts.join(":"));
    }
  }
  return tokens.join(" ");
}

const commitChangesIsValid = (currentTree, snapshotTree) => {
  if (!Array.isArray(currentTree) || !Array.isArray(snapshotTree)) return false;
  if (currentTree.length !== snapshotTree.length) return false;

  const productKeys = ["selectedProductId", "name", "price", "category"];
  const tokenKeys = ["type", "func", "productId", "param1", "param2", "param3"];

  for (let i = 0; i < currentTree.length; i++) {
    const currentProduct = currentTree[i];
    const snapshotProduct = snapshotTree[i];

    for (const key of productKeys) {
      const curVal = currentProduct[key] || "";
      const snapVal = snapshotProduct[key] || "";
      if (curVal !== snapVal) return false;
    }

    if (currentProduct.children.length !== snapshotProduct.children.length) return false;

    for (let j = 0; j < currentProduct.children.length; j++) {
      const curToken = currentProduct.children[j].token || {};
      const snapToken = snapshotProduct.children[j].token || {};
      for (const key of tokenKeys) {
        const curVal = curToken[key] || "";
        const snapVal = snapToken[key] || "";
        if (curVal !== snapVal) return false;
      }
    }
  }
  return true;
};

const extractFromVisualTree = (tree, route, funcsToMatch) => {
  const result = [];
  for (const product of tree) {
    if (!product.selectedProductId || !Array.isArray(product.children)) continue;
    for (const action of product.children) {
      const token = action.token || {};
      if (funcsToMatch.includes(token.func)) {
        result.push({
          productID: product.selectedProductId,
          ratio: token.param1 ? parseFloat(token.param1) : null,
          route,
          func: token.func,
        });
      }
    }
  }
  return result;
};

const extractFromTokens = (product, activeRoute, funcsToMatch, cleanedTokens) => {
  const parsed = parseTokensFromProduct(product, cleanedTokens);
  const result = [];
  for (const route in parsed) {
    if (route === activeRoute) continue;
    for (const token of parsed[route]) {
      if (funcsToMatch.includes(token.func)) {
        result.push({
          productID: token.productId,
          ratio: token.param1 ? parseFloat(token.param1) : null,
          route,
          func: token.func,
        });
      }
    }
  }
  return result;
};

/* ------------------ PRECHECK (once per selection) ------------------ */
/** Mutating precheck: updates backend columns; returns cleaned tokens. */
async function precheckAllTokensCommit(product) {
  const pid = product?.PRODUCT_ID;
  if (!pid) return null;
  const trimOrEmpty = (s) => (typeof s === "string" ? s.trim() : "");

  const [activation, reduction, shipment] = await Promise.all([
    (async () => {
      const t = trimOrEmpty(product.ACTIVATION_TOKEN);
      if (!t) return "";
      const r = await http._tokenPreCheck({
        token: t,
        productID: pid,
        route: "activation",
        mode: "commit", // MUTATE
      });
      return trimOrEmpty(r?.cleanedToken ?? r?.token ?? "");
    })(),
    (async () => {
      const t = trimOrEmpty(product.REDUCTION_TOKEN);
      if (!t) return "";
      const r = await http._tokenPreCheck({
        token: t,
        productID: pid,
        route: "reduction",
        mode: "commit", // MUTATE
      });
      return trimOrEmpty(r?.cleanedToken ?? r?.token ?? "");
    })(),
    (async () => {
      const t = trimOrEmpty(product.SHIPMENT_TOKEN);
      if (!t) return "";
      const r = await http._tokenPreCheck({
        token: t,
        productID: pid,
        route: "shipment",
        mode: "commit", // MUTATE
      });
      return trimOrEmpty(r?.cleanedToken ?? r?.token ?? "");
    })(),
  ]);

  return { productID: pid, activation, reduction, shipment };
}
/* ------------------------------------------------------------------- */

const handleCommit = async (
  tree,
  treeSnapshot,
  route,
  setNotification,
  product,
  cleanedTokens /* use the prechecked tokens */
) => {
  const isSame = commitChangesIsValid(tree, treeSnapshot);
  if (isSame) {
    setNotification({ message: "No changes to commit.", type: "error" });
    return true;
  }

  const visualPostops = extractFromVisualTree(tree, route, ["29wp", "2a1k"]);
  const tokenPostops = extractFromTokens(product, route, ["29wp", "2a1k"], cleanedTokens);
  const allPostops = [...visualPostops, ...tokenPostops];

  const updatedToken = treeToTokenEncoder(tree);

  const dataPacket = {
    route,
    postops: allPostops,
    newToken: updatedToken,
    section: "node",
    product: product.PRODUCT_ID,
  };

  await http.commitChanges(dataPacket);
  setNotification({ message: "Changes committed and token updated.", type: "success" });
  return false;
};

function FlowComponentInner({ props }) {
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [cleanedTokens, setCleanedTokens] = useState(null); // {productID, activation, reduction, shipment}
  const [precheckGen, setPrecheckGen] = useState(0); // guard against races

  const [tree, setTree] = useState(initialTree);
  const [treeSnapshot, setTreeSnapshot] = useState(null);
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const registryMap = useMemo(() => prepareRegistry(props.registry), [props.registry]);

  const handleNodeFieldChange = (nodeId, field, value) => {
    setTree((prevTree) => {
      return prevTree.map((product) => {
        if (product.id === nodeId) {
          return { ...product, [field]: value };
        }
        const updatedChildren = product.children.map((child) => {
          if (child.id === nodeId) {
            return { ...child, token: { ...child.token, [field]: value } };
          }
          return child;
        });
        return { ...product, children: updatedChildren };
      });
    });
  };

  useEffect(() => {
    if (!notification?.message) return;
    const t = setTimeout(() => setNotification({ message: "", type: "" }), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  /* 1) One mutating precheck batch per product selection */
  useEffect(() => {
    const p = props.selectedProduct;
    if (!p?.PRODUCT_ID) { setCleanedTokens(null); return; }

    setPrecheckGen((g) => g + 1);
    const myGen = precheckGen + 1;

    (async () => {
      try {
        const res = await precheckAllTokensCommit(p); // MUTATES backend
        if (myGen !== precheckGen + 1) return; // selection changed during await
        setCleanedTokens(res);
      } catch (e) {
        // fall back to raw tokens if mutation/clean failed
        if (myGen !== precheckGen + 1) return;
        setCleanedTokens({
          productID: p.PRODUCT_ID,
          activation: p.ACTIVATION_TOKEN || "",
          reduction:  p.REDUCTION_TOKEN  || "",
          shipment:   p.SHIPMENT_TOKEN   || "",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedProduct?.PRODUCT_ID]);

  /* 2) Build the visual tree from cleanedTokens (no extra prechecks) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!props.selectedProduct || !props.products || !props.route) return;
      if (!cleanedTokens || cleanedTokens.productID !== props.selectedProduct.PRODUCT_ID) return;

      if (props.refTree) {
        if (!cancelled) {
          setTree(props.refTree);
          setTreeSnapshot(JSON.parse(JSON.stringify(props.refTree)));
        }
        return;
      }

      const parsed = parseTokensFromProduct(props.selectedProduct, cleanedTokens);
      const firstStage = buildFirstStageMapFromParsed(props.selectedProduct, parsed);
      const newTree = finalPhase(firstStage, props.route);

      if (!cancelled) {
        setTree(newTree);
        setTreeSnapshot(JSON.parse(JSON.stringify(newTree)));
      }
    })();
    return () => { cancelled = true; };
  }, [props.selectedProduct, props.products, props.route, props.refTree, cleanedTokens?.productID]);

  /* 3) Rebuild Flow nodes/edges when tree changes */
  useEffect(() => {
    const { nodes, edges } = buildLayout(tree, props, registryMap, handleNodeFieldChange);
    setNodes(nodes);
    setEdges(edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const onNodeClick = useCallback((_, node) => {
    if (node.data?.label === "+ Add Product") {
      const newProdId = uuidv4();
      setTree((prev) => [...prev, { id: newProdId, name: "New Product", type: "product", children: [] }]);
    } else if (node.data?.label === "+ Add Action") {
      setTree((prev) =>
        prev.map((product) =>
          `${product.id}-add` === node.id
            ? { ...product, children: [...product.children, { id: uuidv4(), name: "New Action" }] }
            : product
        )
      );
    }
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const tag = e.target.tagName.toLowerCase();
      const isEditable = ["input", "textarea"].includes(tag) || e.target.isContentEditable;
      if (isEditable) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        const selected = rfNodes.find((n) => n.selected && n.deletable);
        if (!selected) return;

        const id = selected.id;
        setTree((prev) => {
          const productIndex = prev.findIndex((p) => p.id === id);
          if (productIndex !== -1) {
            const next = [...prev];
            next.splice(productIndex, 1);
            return next;
          }
          return prev.map((product) => ({
            ...product,
            children: product.children.filter((c) => c.id !== id),
          }));
        });
      }
    },
    [rfNodes]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "95%",
        height: "600px",
        borderStyle: "solid",
        borderWidth: "7px",
        borderColor: "rgba(0, 28, 62, 0.75)",
        borderRadius: "10px",
      }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {notification.message && (
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 25,
            zIndex: 1001,
            padding: "12px 24px",
            borderRadius: "12px",
            background: notification.type === "error" ? "#c62828" : "#0b00a2ff",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.5)",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          {notification.message}
        </div>
      )}

      <button
        onClick={async () => {
          const isSame = await handleCommit(
            tree,
            treeSnapshot,
            props.route,
            setNotification,
            props.selectedProduct,
            cleanedTokens
          );
          if (!isSame) {
            props.setRefTree?.(JSON.parse(JSON.stringify(tree)));
            setTreeSnapshot(JSON.parse(JSON.stringify(tree)));
          }
        }}
        style={{
          position: "absolute",
          top: 15,
          right: 25,
          zIndex: 1000,
          padding: "12px 24px",
          borderRadius: "12px",
          background: "linear-gradient(145deg, #2f2f2f, #3e3e3e)",
          border: "3px solid #00bcd4",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "16px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.5)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
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
        style={{ width: "100%", height: "100%", backgroundColor: "#3e5778d4" }}
        fitView
      >
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "productNode") return "#886f15ff";
            if (node.type === "actionNode") return "#b2c781ff";
            return "#90caf9";
          }}
          maskColor="rgba(255, 255, 255, 0.09)"
          style={{
            backgroundColor: "#121212f1",
            border: "1px solid #444",
            borderRadius: 6,
          }}
        />
        <Background variant="dots" gap={16} size={5} color="#4f4c4cf5" style={{ opacity: 0.4 }} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function NodeRenderer(props) {
  return (
    <ReactFlowProvider>
      <FlowComponentInner props={props} />
    </ReactFlowProvider>
  );
}
