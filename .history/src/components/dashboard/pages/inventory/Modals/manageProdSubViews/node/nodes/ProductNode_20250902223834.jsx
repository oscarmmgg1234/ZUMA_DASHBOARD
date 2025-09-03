import React, { useState, useEffect, useMemo } from "react";
import { Handle, Position } from "reactflow";

/* ===== Effect chips config ===== */
const EFFECT_LABEL = {
  receipt: "Receipt",
  "stored up": "Stored ↑",
  "stored down": "Stored ↓",
  "active up": "Active ↑",
  "active down": "Active ↓",
  shipment: "Shipment →",
};
const EFFECT_ORDER = [
  "receipt",
  "stored down",
  "stored up",
  "active down",
  "active up",
  "shipment",
];
const EFFECT_HINT = {
  receipt: "Writes a receipt row (reversible).",
  "stored up": "Increases Stored inventory.",
  "stored down": "Decreases Stored inventory.",
  "active up": "Increases Active inventory.",
  "active down": "Decreases Active inventory.",
  shipment: "Records/affects a shipment.",
};

/* ===== Helpers to collect effects for this product’s actions ===== */
function buildFunctionIndex(registryMap) {
  const idx = new Map();
  if (!registryMap || typeof registryMap.forEach !== "function") return idx;
  registryMap.forEach((arr) => {
    (arr || []).forEach((fn) => {
      if (fn && fn.id) idx.set(fn.id, fn);
    });
  });
  return idx;
}

function collectEffects(actions, fnIndex) {
  const seen = new Set();
  const out = [];
  (actions || []).forEach((t) => {
    const fn = t && fnIndex.get(t.func);
    const eff = fn?.meta_data?.effect;
    if (!eff) return;
    const list = Array.isArray(eff) ? eff : [eff];
    list.forEach((raw) => {
      const key = String(raw || "").toLowerCase();
      if (!key) return;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    });
  });
  const rank = (k) => {
    const i = EFFECT_ORDER.indexOf(k);
    return i === -1 ? 999 : i;
  };
  out.sort((a, b) => rank(a) - rank(b));
  return out;
}

function ProductNode({ data }) {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(
    data.selectedProductId || ""
  );

  // keep local select in sync with upstream
  useEffect(() => {
    setSelectedProductId(data.selectedProductId || "");
  }, [data.selectedProductId]);

  const filteredProducts = (data.products || []).filter((p) =>
    (p.NAME || "").toLowerCase().includes(search.toLowerCase())
  );

  const fnIndex = useMemo(
    () => buildFunctionIndex(data.registryMap),
    [data.registryMap]
  );
  const effects = useMemo(
    () => collectEffects(data.actions || [], fnIndex),
    [data.actions, fnIndex]
  );

  return (
    <div
      style={{
        border: "6px solid #aaa",
        borderRadius: 15,
        padding: 8,
        backgroundColor: "#919de2dd",
        width: 260,
        fontSize: 30,
        textAlign: "center",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555", width: 10, height: 10 }}
      />

      {/* Title */}
      <div style={{ fontWeight: 600, marginBottom: 6, color: "black" }}>
        Product
      </div>

      {/* 🔹 Effects banner (deduped) */}
      {effects.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 8px",
            marginBottom: 6,
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "rgba(255,255,255,0.75)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {effects.map((e) => (
            <span
              key={e}
              title={EFFECT_HINT[e] || e}
              style={{
                fontSize: 20,
                lineHeight: "18px",
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "rgba(223, 67, 67, 0.9)",
                color: "#111827",
                whiteSpace: "nowrap",
                fontWeight: "bold"
              }}
            >
              {EFFECT_LABEL[e] || e}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          fontSize: 23,
          padding: 3,
          marginBottom: 4,
          color: "grey",
        }}
      />

      {/* Selector */}
      <select
        value={selectedProductId}
        onChange={(e) => {
          const productId = e.target.value;
          setSelectedProductId(productId);
          const product =
            (data.products || []).find((p) => p.PRODUCT_ID === productId) ||
            null;

          // keep tree state in sync
          data.onFieldChange?.(data.id, "selectedProductId", productId);
          data.onFieldChange?.(data.id, "name", product?.NAME || "");
        }}
        style={{
          width: "100%",
          fontSize: 30,
          fontWeight: "bold",
          padding: 3,
          color: "black",
        }}
      >
        <option value="">-- Choose --</option>
        {filteredProducts.map((product) => (
          <option key={product.PRODUCT_ID} value={product.PRODUCT_ID}>
            {product.NAME}
          </option>
        ))}
      </select>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555", width: 10, height: 10 }}
      />
    </div>
  );
}

export default ProductNode;
