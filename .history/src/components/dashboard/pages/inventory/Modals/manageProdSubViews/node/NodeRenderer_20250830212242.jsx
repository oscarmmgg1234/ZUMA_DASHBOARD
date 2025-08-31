// NodeRenderer.jsx — cache-based, no precheck on save, backend unchanged
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
  { id: uuidv4(), name: "Product 1", type: "product", children: [] },
];

/* -------------------- PURE token parser (no HTTP) -------------------- */
const parseTokenString = (tokenStr, pid) => {
  const s = (tokenStr || "").trim();
  if (!s) return [];
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((entry) => {
      const [type, func, id, p1, p2, p3] = entry.split(":");
      return {
        type: type?.toLowerCase() || null,
        func: func || null,
        productId: id || pid,
        param1: p1 ?? null,
        param2: p2 ?? null,
        param3: p3 ?? null,
      };
    })
    .filter((t) => !["preops", "postops", "virtualops"].includes(t.type));
};
/* -------------------------------------------------------------------- */

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

const prepareRegistry = (registry) => {
  const registryMap = new Map();
  for (const item of registry || []) {
    const classKey = item.class;
    if (classKey === "PREOPS" || classKey === "POSTOPS" || classKey === "VIRTUALOPS") continue;
    if (!registryMap.has(classKey)) registryMap.set(classKey, []);
    registryMap.get(classKey).push(item);
  }
  return registryMap;
};

const buildFirstStageFromParsed = (parsed) => {
  const firstStage = new Map();
  Object.entries(parsed).forEach(([category, tokens]) => {
    if (!firstStage.has(category)) firstStage.set(category, new Map());
    tokens.forEach((t) => {
      const pid = t.productId;
      if (!firstStage.get(category).has(pid)) firstStage.get(category).set(pid, []);
      firstStage.get(category).get(pid).push(t);
    });
  });
  return firstStage;
};

function finalPhase(firstStage, route /*, allProducts */) {
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

function treeToTokenEncoder(tree, route) {
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

    if (currentProduct.children.length !== snapshotProduct.children.length) {
      return false;
    }

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

/* --------- PURE postops extractors (no backend calls) ---------- */
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

const extractFromCachedTokens = (cachedTokens, pid, activeRoute, funcsToMatch) => {
  if (!cachedTokens) return [];
  const routeToString = {
    activation: cachedTokens.activation || "",
    reduction: cachedTokens.reduction || "",
    shipment: cachedTokens.shipment || "",
  };
  const routes = ["activation", "reduction", "shipment"];
  const result = [];

  for (const route of routes) {
    if (route === activeRoute) continue;
    const list = parseTokenString(routeToString[route], pid);
    for (const token of list) {
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
/* --------------------------------------------------------------- */

function FlowComponentInner({ props }) {
  const [notification, setNotification] = useState({ message: "", type: "" });

  // cache for the current product only (cleared on product change)
  const [activeTokens, setActiveTokens] = useState(null); // { productID, activation, reduction, shipment }

  const [tree, setTree] = useState(initialTree);
  const [treeSnapshot, setTreeSnapshot] = useState(null);
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const registryMap = useMemo(() => prepareRegistry(props.registry), [props.registry]);

  const handleNodeFieldChange = (nodeId, field, value) => {
    setTree((prevTree) =>
      prevTree.map((product) => {
        if (product.id === nodeId) return { ...product, [field]: value };
        const updatedChildren = product.children.map((child) =>
          child.id === nodeId ? { ...child, token: { ...child.token, [field]: value } } : child
        );
        return { ...product, children: updatedChildren };
      })
    );
  };

  useEffect(() => {
    if (!notification?.message) return;
    const t = setTimeout(() => setNotification({ message: "", type: "" }), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  /* A) On product change: clear cache and precheck once (backend unchanged) */
  useEffect(() => {
    const p = props.selectedProduct;
    const pid = p?.PRODUCT_ID;
    if (!pid) {
      setActiveTokens(null);
      return;
    }

    let alive = true;
    const trim = (x) => (typeof x === "string" ? x.trim() : "");

    (async () => {
      // run backend _tokenPreCheck only once per column here
      const [act, red, shp] = await Promise.all([
        p.ACTIVATION_TOKEN ? http._tokenPreCheck({ token: trim(p.ACTIVATION_TOKEN), productID: pid }) : { token: "" },
        p.REDUCTION_TOKEN  ? http._tokenPreCheck({ token: trim(p.REDUCTION_TOKEN),  productID: pid }) : { token: "" },
        p.SHIPMENT_TOKEN   ? http._tokenPreCheck({ token: trim(p.SHIPMENT_TOKEN),   productID: pid }) : { token: "" },
      ]);

      if (!alive) return;

      const cleaned = {
        productID: pid,
        activation: trim(act.token),
        reduction:  trim(red.token),
        shipment:   trim(shp.token),
      };

      // cache
      setActiveTokens(cleaned);

      // keep selectedProduct in sync with DB’s cleaned strings
      props.setSelectedProduct?.((prev) =>
        prev && prev.PRODUCT_ID === pid
          ? {
              ...prev,
              ACTIVATION_TOKEN: cleaned.activation,
              REDUCTION_TOKEN: cleaned.reduction,
              SHIPMENT_TOKEN: cleaned.shipment,
            }
          : prev
      );
    })().catch((e) => {
      console.error("token precheck error:", e);
      // fallback to raw (still set so we can render)
      setActiveTokens({
        productID: pid,
        activation: p?.ACTIVATION_TOKEN || "",
        reduction:  p?.REDUCTION_TOKEN  || "",
        shipment:   p?.SHIPMENT_TOKEN   || "",
      });
    });

    return () => {
      alive = false;
      // hard clear when switching products (your requested behavior)
      setActiveTokens(null);
    };
  }, [props.selectedProduct?.PRODUCT_ID]);

  /* B) Build tree strictly from cached tokens (pure, no HTTP) */
  useEffect(() => {
    const pid = props.selectedProduct?.PRODUCT_ID;
    if (!pid || !activeTokens || activeTokens.productID !== pid || !props.route) return;

    const parsed = {
      activation: parseTokenString(activeTokens.activation, pid),
      reduction:  parseTokenString(activeTokens.reduction,  pid),
      shipment:   parseTokenString(activeTokens.shipment,   pid),
    };

    const firstStage = buildFirstStageFromParsed(parsed);
    const newTree = finalPhase(firstStage, props.route /*, props.products */);
    setTree(newTree);
    setTreeSnapshot(JSON.parse(JSON.stringify(newTree)));
  }, [props.route, activeTokens?.productID, props.selectedProduct?.PRODUCT_ID]);

  /* C) Rebuild RF graph on tree changes */
  useEffect(() => {
    const { nodes, edges } = buildLayout(tree, props, registryMap, handleNodeFieldChange);
    setNodes(nodes);
    setEdges(edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  /* D) Save: commit token, then update cache + selectedProduct (no precheck here) */
  const handleCommit = useCallback(async () => {
    const isSame = commitChangesIsValid(tree, treeSnapshot);
    if (isSame) {
      setNotification({ message: "No changes to commit.", type: "error" });
      return;
    }

    // Build new token from the visual tree
    const updatedToken = treeToTokenEncoder(tree, props.route);

    // Optional: collect postops like before (visual + cached-other-routes)
    const visualPostops = extractFromVisualTree(tree, props.route, ["29wp", "2a1k"]);
    const tokenPostops = extractFromCachedTokens(
      activeTokens,
      props.selectedProduct.PRODUCT_ID,
      props.route,
      ["29wp", "2a1k"]
    );
    const allPostops = [...visualPostops, ...tokenPostops];

    const dataPacket = {
      route: props.route,
      postops: allPostops,
      newToken: updatedToken,
      section: "node",
      product: props.selectedProduct.PRODUCT_ID,
    };

    await http.commitChanges(dataPacket);

    // sync client model == server model (cache + selectedProduct)
    const pid = props.selectedProduct.PRODUCT_ID;
    setActiveTokens((prev) =>
      prev && prev.productID === pid ? { ...prev, [props.route]: updatedToken } : prev
    );

    const columnByRoute = {
      activation: "ACTIVATION_TOKEN",
      reduction: "REDUCTION_TOKEN",
      shipment: "SHIPMENT_TOKEN",
    };
    props.setSelectedProduct?.((prevProd) =>
      prevProd && prevProd.PRODUCT_ID === pid
        ? { ...prevProd, [columnByRoute[props.route]]: updatedToken }
        : prevProd
    );

    // capture snapshot for "no changes" detection
    setTreeSnapshot(JSON.parse(JSON.stringify(tree)));
    setNotification({ message: "Changes committed and token updated.", type: "success" });

    // also let parent store this visual as refTree if you want
    props.setRefTree?.(JSON.parse(JSON.stringify(tree)));
  }, [tree, treeSnapshot, props.route, props.selectedProduct?.PRODUCT_ID, activeTokens]);

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
          const idx = prev.findIndex((p) => p.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
          }
          return prev.map((p) => ({ ...p, children: p.children.filter((c) => c.id !== id) }));
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
        onClick={handleCommit}
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
          style={{ backgroundColor: "#121212f1", border: "1px solid #444", borderRadius: 6 }}
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
