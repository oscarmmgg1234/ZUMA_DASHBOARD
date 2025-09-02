// NodeRenderer.jsx — Pure client-side precheck (no backend precheck)
// - On product select: clean tokens using props.products list (drop entries with unknown PRODUCT_ID)
// - Render graph from cleaned tokens only
// - On Save: encode token from tree and call commitChanges; keep local state in sync

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

/* -------------------- PURE token helpers (no HTTP) -------------------- */

// normalize to single spaces
const norm = (s) =>
  typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "";

// split into raw token entries
const splitEntries = (s) => norm(s).split(" ").filter(Boolean);

// parse one entry (permissive)
const parseEntry = (entry, fallbackPid) => {
  const [type, func, id, p1, p2, p3] = entry.split(":");
  return {
    raw: entry,
    type: type?.toLowerCase() || null,
    func: func || null,
    productId: id || fallbackPid || "",
    param1: p1 ?? null,
    param2: p2 ?? null,
    param3: p3 ?? null,
  };
};

// remove entries whose 3rd field (productId) is NOT present in validIds
const cleanOneRoute = (tokenStr, validIds) => {
  const cleaned = splitEntries(tokenStr).filter((entry) => {
    const parts = entry.split(":");
    if (parts.length < 3) return false; // must have at least CLASS:FUNC:PRODUCT_ID
    const pid = String(parts[2] || "").trim();
    return pid && validIds.has(pid);
  });
  return cleaned.join(" ");
};

// Clean all three routes, purely client-side
const purePrecheckTokens = (product, products) => {
  const validIds = new Set((products || []).map((p) => String(p.PRODUCT_ID)));
  const act = cleanOneRoute(product?.ACTIVATION_TOKEN || "", validIds);
  const red = cleanOneRoute(product?.REDUCTION_TOKEN || "", validIds);
  const shp = cleanOneRoute(product?.SHIPMENT_TOKEN || "", validIds);
  return {
    productID: product?.PRODUCT_ID || "",
    activation: act,
    reduction: red,
    shipment: shp,
  };
};

// Parser that excludes maintenance classes for the graph
const parseForGraph = (tokenStr, pid) =>
  splitEntries(tokenStr)
    .map((e) => parseEntry(e, pid))
    .filter(
      (t) => t.type && !["preops", "postops", "virtualops"].includes(t.type)
    );

/* --------------------------------------------------------------------- */

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
         registryMap,                            // for lookup of effects
  actions: (product.children || [])       // all action tokens in this column
     .map((c) => c?.token)
     .filter(Boolean),
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

    for (let j = 0; j < (product.children || []).length; j++) {
      const action = product.children[j];
      const actionY = productY + 700 * (j + 1);

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
    const addY = productY + 700 * ((product.children || []).length + 1);

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
    if (
      classKey === "PREOPS" ||
      classKey === "POSTOPS" ||
      classKey === "VIRTUALOPS"
    )
      continue;
    if (!registryMap.has(classKey)) registryMap.set(classKey, []);
    registryMap.get(classKey).push(item);
  }
  return registryMap;
};

const buildFirstStageFromParsed = (parsed) => {
  const firstStage = new Map();
  Object.entries(parsed).forEach(([category, tokens]) => {
    if (!firstStage.has(category)) firstStage.set(category, new Map());
    (tokens || []).forEach((t) => {
      const pid = t.productId;
      if (!firstStage.get(category).has(pid))
        firstStage.get(category).set(pid, []);
      firstStage.get(category).get(pid).push(t);
    });
  });
  return firstStage;
};

function finalPhase(firstStage, route) {
  const result = [];
  const productMap = firstStage.get(route);
  if (!productMap) return result;

  for (const [productId, tokens] of productMap.entries()) {
    const children = (tokens || []).map((token) => ({
      id: `action-${uuidv4()}`,
      name: token.func,
      token,
    }));
    result.push({
      id: `prod-${productId}`,
      name: `Product ${String(productId).slice(0, 4)}`,
      type: "product",
      selectedProductId: productId,
      children,
    });
  }
  return result;
}

function treeToTokenEncoder(tree /*, route */) {
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

  const productKeys = ["selectedProductId", "name"]; // keep minimal & safe
  const tokenKeys = ["type", "func", "productId", "param1", "param2", "param3"];

  for (let i = 0; i < currentTree.length; i++) {
    const currentProduct = currentTree[i];
    const snapshotProduct = snapshotTree[i];

    for (const key of productKeys) {
      const curVal = currentProduct[key] || "";
      const snapVal = snapshotProduct[key] || "";
      if (curVal !== snapVal) return false;
    }

    if ((currentProduct.children || []).length !== (snapshotProduct.children || []).length) {
      return false;
    }

    for (let j = 0; j < (currentProduct.children || []).length; j++) {
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

function FlowComponentInner({ props }) {
  const [notification, setNotification] = useState({ message: "", type: "" });

  // cleaned tokens for the currently selected product (client-side only)
  const [cleanedTokens, setCleanedTokens] = useState(null); // { productID, activation, reduction, shipment }

  const [tree, setTree] = useState(initialTree);
  const [treeSnapshot, setTreeSnapshot] = useState(initialTree);
  const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const registryMap = useMemo(
    () => prepareRegistry(props.registry),
    [props.registry]
  );

  const handleNodeFieldChange = (nodeId, field, value) => {
    setTree((prevTree) =>
      prevTree.map((product) => {
        if (product.id === nodeId) return { ...product, [field]: value };
        const updatedChildren = (product.children || []).map((child) =>
          child.id === nodeId
            ? { ...child, token: { ...child.token, [field]: value } }
            : child
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

  /* A) On product or products-list change: client-side clean, no HTTP */
  useEffect(() => {
    const p = props.selectedProduct;
    if (!p?.PRODUCT_ID) {
      setCleanedTokens(null);
      setTree(initialTree);
      setTreeSnapshot(initialTree);
      return;
    }
    const cleaned = purePrecheckTokens(p, props.products || []);
    setCleanedTokens(cleaned);
  }, [props.selectedProduct?.PRODUCT_ID, props.products]);

  /* B) Build tree strictly from cleaned tokens (pure, no HTTP) */
  useEffect(() => {
    const pid = props.selectedProduct?.PRODUCT_ID;
    if (!pid || !cleanedTokens || cleanedTokens.productID !== pid) return;

    const parsed = {
      activation: parseForGraph(cleanedTokens.activation, pid),
      reduction: parseForGraph(cleanedTokens.reduction, pid),
      shipment: parseForGraph(cleanedTokens.shipment, pid),
    };

    const firstStage = buildFirstStageFromParsed(parsed);
    const newTree = finalPhase(firstStage, props.route || "activation");

    setTree(newTree);
    setTreeSnapshot(JSON.parse(JSON.stringify(newTree)));
  }, [props.route, cleanedTokens?.productID, cleanedTokens, props.selectedProduct?.PRODUCT_ID]);

  /* C) Rebuild RF graph on tree changes */
  useEffect(() => {
    const { nodes, edges } = buildLayout(
      tree,
      props,
      registryMap,
      handleNodeFieldChange
    );
    setNodes(nodes);
    setEdges(edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, registryMap, props.products, props.route]);

  /* D) Save: encode token, commit, then update local cleaned state ONLY for active route */
  const handleCommit = useCallback(async () => {
    if (!props.selectedProduct?.PRODUCT_ID) return;

    const isSame = commitChangesIsValid(tree, treeSnapshot);
    if (isSame) {
      setNotification({ message: "No changes to commit.", type: "error" });
      return;
    }

    // Encode new token from visual tree (for the current route)
    const updatedToken = norm(treeToTokenEncoder(tree /*, props.route*/));

    // Commit to backend: write the new token for the active route
    const dataPacket = {
      route: props.route, // "activation" | "reduction" | "shipment"
      postops: [],        // keep if you still need; otherwise leave as []
      newToken: updatedToken,
      section: "node",
      product: props.selectedProduct.PRODUCT_ID,
    };

    await http.commitChanges(dataPacket);

    // Update local cleanedTokens for current route (keep other routes intact)
    setCleanedTokens((prev) =>
      prev && prev.productID === props.selectedProduct.PRODUCT_ID
        ? { ...prev, [props.route]: updatedToken }
        : prev
    );

    // Optionally mirror into selectedProduct (UI only; not DB readback)
    const columnByRoute = {
      activation: "ACTIVATION_TOKEN",
      reduction: "REDUCTION_TOKEN",
      shipment: "SHIPMENT_TOKEN",
    };
    props.setSelectedProduct?.((prev) =>
      prev && prev.PRODUCT_ID === props.selectedProduct.PRODUCT_ID
        ? { ...prev, [columnByRoute[props.route]]: updatedToken }
        : prev
    );

    // New snapshot
    const cloned = JSON.parse(JSON.stringify(tree));
    setTreeSnapshot(cloned);

    setNotification({ message: "Changes committed.", type: "success" });

    // Keep refTree flow if you use it elsewhere
    props.setRefTree?.(cloned);
  }, [tree, treeSnapshot, props.route, props.selectedProduct?.PRODUCT_ID, props.setSelectedProduct, props.setRefTree]);

  const onNodeClick = useCallback((_, node) => {
    if (node?.data?.label === "+ Add Product") {
      const newProdId = uuidv4();
      setTree((prev) => [
        ...prev,
        { id: newProdId, name: "New Product", type: "product", children: [] },
      ]);
    } else if (node?.data?.label === "+ Add Action") {
      setTree((prev) =>
        prev.map((product) =>
          `${product.id}-add` === node.id
            ? {
                ...product,
                children: [
                  ...(product.children || []),
                  { id: uuidv4(), name: "New Action" },
                ],
              }
            : product
        )
      );
    }
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const tag = e.target.tagName?.toLowerCase?.() || "";
      const isEditable =
        ["input", "textarea"].includes(tag) || e.target.isContentEditable;
      if (isEditable) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        const selected = rfNodes.find((n) => n.selected && n.deletable !== false);
        if (!selected) return;
        const id = selected.id;

        setTree((prev) => {
          const idx = prev.findIndex((p) => p.id === id);
          if (idx !== -1) {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
          }
          return prev.map((p) => ({
            ...p,
            children: (p.children || []).filter((c) => c.id !== id),
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
        position: "relative",       width: props.containerWidth || "95%",
      height: props.containerHeight || "600px",
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
          style={{
            backgroundColor: "#121212f1",
            border: "1px solid #444",
            borderRadius: 6,
          }}
        />
        <Background
          variant="dots"
          gap={16}
          size={5}
          color="#4f4c4cf5"
          style={{ opacity: 0.4 }}
        />
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
//pure non-precheck