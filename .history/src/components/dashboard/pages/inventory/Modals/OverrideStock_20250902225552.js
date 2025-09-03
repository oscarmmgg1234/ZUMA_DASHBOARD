import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * OverrideStock — Minimal packet + inline commit + animations
 * - Sends only { PRODUCT_ID, QUANTITY, ACTION } to backend
 * - ACTION ∈ {"STORED_STOCK" | "ACTIVE_STOCK"}
 * - Optimistic UI, row saving pulse, success flash (green bg + black text)
 * - Pool-linked products lock STORED_STOCK
 * - No toFixed anywhere; floats allowed
 */
export default function OverrideStock(props) {
  const { visible, closeHandler } = props;

  const [products, setProducts] = useState([]); // includes poolRef
  const [inventoryMap, setInventoryMap] = useState(new Map()); // PRODUCT_ID -> { ACTIVE_STOCK, STORED_STOCK }

  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingField, setEditingField] = useState(null); // "STORED_STOCK" | "ACTIVE_STOCK"
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [rowSavingId, setRowSavingId] = useState(null);
  const [flashCellKey, setFlashCellKey] = useState("");
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  // -------------------- Init --------------------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const productInventory = await http.getProductsInventory();
        const invMap = new Map(
          (productInventory?.data || []).map((item) => [item.PRODUCT_ID, item])
        );
        setInventoryMap(invMap);

        const productsRes = await http.getProducts();
        const formatted = (productsRes?.data || []).map((p) => ({ ...p }));
        setProducts(formatted);
      } catch (e) {
        setError(e?.message || "Failed to load inventory/products");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  // -------------------- Derived --------------------
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        String(p.NAME || "")
          .toLowerCase()
          .includes(q) ||
        String(p.PRODUCT_ID || "")
          .toLowerCase()
          .includes(q)
    );
  }, [products, searchQuery]);

  const isVirtualLinked = (product) => !!product?.poolRef;

  // -------------------- Handlers --------------------
  const handleEditClick = (product, field) => {
    if (field === "STORED_STOCK" && isVirtualLinked(product)) {
      setBanner(
        `⚠️ ${product.NAME} uses Virtual Stock (pool ${product.poolRef}). Stored stock is managed by the pool.`
      );
      return;
    }
    setBanner("");
    setEditingProductId(product.PRODUCT_ID);
    setEditingField(field);

    const current =
      field === "STORED_STOCK"
        ? inventoryMap.get(product.PRODUCT_ID)?.STORED_STOCK
        : inventoryMap.get(product.PRODUCT_ID)?.ACTIVE_STOCK;

    const safe =
      typeof current === "number" && !Number.isNaN(current) ? current : 0;

    // no toFixed; preserve float as-is
    setQuantity(String(safe));
  };

  const commitChange = async () => {
    if (quantity === "" || !editingField || !editingProductId) {
      setBanner("Quantity cannot be empty.");
      return;
    }

    const productId = editingProductId;
    const field = editingField;

    const currentStock =
      field === "STORED_STOCK"
        ? inventoryMap.get(productId)?.STORED_STOCK
        : inventoryMap.get(productId)?.ACTIVE_STOCK;

    const before =
      typeof currentStock === "number" && !Number.isNaN(currentStock)
        ? currentStock
        : 0;

    const target = Number(quantity);
    if (Number.isNaN(target)) {
      setBanner("Quantity must be a valid number.");
      return;
    }

    const diff = target - before;

    const payload = {
      PRODUCT_ID: productId,
      QUANTITY: diff,
      ACTION: field, // "STORED_STOCK" | "ACTIVE_STOCK"
    };

    setRowSavingId(productId);
    setError("");
    try {
      await http.updateStock(payload, field === "STORED_STOCK");

      setInventoryMap((prev) => {
        const updated = new Map(prev);
        const item = { ...(updated.get(productId) || {}) };
        if (field === "STORED_STOCK") item.STORED_STOCK = target;
        else item.ACTIVE_STOCK = target;
        updated.set(productId, item);
        return updated;
      });

      setFlashCellKey(`${productId}:${field}:${Date.now()}`);
      setBanner("Stock updated.");
    } catch (e) {
      setError(e?.message || "Failed to update stock");
    } finally {
      setRowSavingId(null);
      setEditingProductId(null);
      setEditingField(null);
      setQuantity("");
      setTimeout(() => setBanner(""), 1200);
    }
  };

  const onQuantityKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitChange();
    } else if (e.key === "Escape") {
      setEditingProductId(null);
      setEditingField(null);
      setQuantity("");
    }
  };

  // -------------------- UI bits --------------------
  const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />
  );

  const CellFlash = ({ cellKey, children }) => {
    // green background + black text, fades out naturally
    return (
      <span
        key={cellKey}
        className="inline-block rounded px-1 transition-[background-color] duration-700 bg-emerald-200 text-black"
      >
        {children}
      </span>
    );
  };

  // -------------------- Row --------------------
  const Row = ({ product, index }) => {
    const inv = inventoryMap.get(product.PRODUCT_ID) || {};
    const isVirtual = isVirtualLinked(product);
    const isEditingStored =
      editingField === "STORED_STOCK" &&
      editingProductId === product.PRODUCT_ID;
    const isEditingActive =
      editingField === "ACTIVE_STOCK" &&
      editingProductId === product.PRODUCT_ID;

    const saving = rowSavingId === product.PRODUCT_ID;

    const cellKeyStored =
      flashCellKey &&
      flashCellKey.startsWith(`${product.PRODUCT_ID}:STORED_STOCK`)
        ? flashCellKey
        : undefined;
    const cellKeyActive =
      flashCellKey &&
      flashCellKey.startsWith(`${product.PRODUCT_ID}:ACTIVE_STOCK`)
        ? flashCellKey
        : undefined;

    const renderNumber = (v) =>
      typeof v === "number" && Number.isFinite(v) ? String(v) : "N/A";

    return (
      <tr
        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${
          saving ? "animate-pulse" : ""
        }`}
      >
        <td className="px-4 py-2 border text-black">{product.NAME}</td>
        <td className="px-4 py-2 border font-mono text-xs text-black">
          {product.PRODUCT_ID}
        </td>
        <td className="px-4 py-2 border text-black">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-black">
              {product.poolRef || "—"}
            </span>
            {isVirtual ? (
              <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-medium text-black">
                Virtual
              </span>
            ) : (
              <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-medium text-black">
                Direct
              </span>
            )}
          </div>
        </td>

        {/* STORED_STOCK (locked if virtual linked) */}
        <td
          className={`px-4 py-2 border ${
            isVirtual
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:bg-amber-100"
          }`}
          onClick={() => {
            if (!isVirtual) handleEditClick(product, "STORED_STOCK");
          }}
          title={isVirtual ? "Managed by Virtual Pool" : "Click to edit"}
        >
          {isEditingStored ? (
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={onQuantityKey}
              className="w-full rounded-md border border-black/40 px-2 py-1 text-black focus:ring-2 focus:ring-black/20"
              autoFocus
            />
          ) : cellKeyStored ? (
            <CellFlash cellKey={cellKeyStored}>
              {renderNumber(inv.STORED_STOCK)}
            </CellFlash>
          ) : (
            <span className="text-black">{renderNumber(inv.STORED_STOCK)}</span>
          )}
        </td>

        {/* ACTIVE_STOCK */}
        <td
          className="px-4 py-2 border cursor-pointer hover:bg-amber-100"
          onClick={() => handleEditClick(product, "ACTIVE_STOCK")}
          title="Click to edit"
        >
          {isEditingActive ? (
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={onQuantityKey}
              className="w-full rounded-md border border-black/40 px-2 py-1 text-black focus:ring-2 focus:ring-black/20"
              autoFocus
            />
          ) : cellKeyActive ? (
            <CellFlash cellKey={cellKeyActive}>
              {renderNumber(inv.ACTIVE_STOCK)}
            </CellFlash>
          ) : (
            <span className="text-black">{renderNumber(inv.ACTIVE_STOCK)}</span>
          )}
        </td>

        <td className="px-4 py-2 border text-right">
          {editingProductId === product.PRODUCT_ID ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
              onClick={commitChange}
              disabled={saving}
            >
              {saving && <Spinner />}
              Commit Change
            </button>
          ) : (
            <span className="text-xs text-black/60">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"Manual Stock Override"}
      closeName={"manual"}
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow">
              <Spinner />
              <span className="text-sm text-black">Loading...</span>
            </div>
          </div>
        )}

        <div className="p-4">
          {banner && (
            <div className="mb-3 rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm text-black">
              {banner}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-xl border border-rose-300 bg-rose-100 px-4 py-3 text-sm text-black">
              {error}
            </div>
          )}

          <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-black/10 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/30 px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20 md:max-w-md"
                placeholder="Search by name or ID"
              />
              <div className="text-xs text-black/70">
                Pool-linked products show a{" "}
                <span className="rounded bg-indigo-200 px-1 py-0.5 font-medium text-black">
                  Virtual
                </span>{" "}
                badge; their Stored Stock is locked.
              </div>
            </div>
          </div>

          <div className="h-[55vh] overflow-auto rounded-2xl border border-black/20">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-black">
                <tr>
                  <th className="px-4 py-2 border">Product Name</th>
                  <th className="px-4 py-2 border">Product ID</th>
                  <th className="px-4 py-2 border">Pool Ref</th>
                  <th className="px-4 py-2 border">Stored Stock</th>
                  <th className="px-4 py-2 border">Active Stock</th>
                  <th className="px-4 py-2 border text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => (
                  <Row key={p.PRODUCT_ID} product={p} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
