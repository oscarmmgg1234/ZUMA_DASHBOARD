import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * ProductTracking — Professional UI/UX refactor
 * - Searchable list with sticky header
 * - Inline edit for MIN_LIMIT (tracking threshold)
 * - Clear/concise status and commit flow
 * - Local optimistic update, network error banner
 */
export default function ProductTracking(props) {
  const { visible, closeHandler } = props;

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);
  const [draftQuantity, setDraftQuantity] = useState("");

  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // -------------------- Init --------------------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await http.getProducts();
        setProducts(res?.data || []);
      } catch (e) {
        setError(e?.message || "Failed to load products");
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

  // -------------------- Handlers --------------------
  const beginEdit = (productId, current) => {
    setEditingProductId(productId);
    setDraftQuantity(current != null ? String(current) : "");
    setError("");
    setBanner("");
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setDraftQuantity("");
  };

  const commit = async (productId) => {
    setError("");
    if (!productId) return;

    // Empty string => remove tracking (set null)
    const trimmed = draftQuantity.trim();
    let payloadQty = null;
    if (trimmed !== "") {
      const parsed = parseInt(trimmed, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        setError(
          "Tracking limit must be a non-negative integer or left blank to remove"
        );
        return;
      }
      payloadQty = parsed;
    }

    const data = { productID: productId, quantity: payloadQty };
    setBusyId(productId);
    try {
      await http.updateTracking(data);
      // optimistic local update
      setProducts((prev) =>
        prev.map((p) =>
          p.PRODUCT_ID === productId ? { ...p, MIN_LIMIT: payloadQty } : p
        )
      );

      const name =
        products.find((p) => p.PRODUCT_ID === productId)?.NAME || productId;
      setBanner(
        payloadQty == null
          ? `Removed tracking for ${name}`
          : `Set tracking limit for ${name} to ${payloadQty}`
      );
      cancelEdit();
    } catch (e) {
      setError(e?.message || "Failed to update tracking limit");
    } finally {
      setBusyId(null);
    }
  };

  // -------------------- UI helper components --------------------
  const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
  );

  const Overlay = ({ show, label }) =>
    show ? (
      <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow">
          <Spinner />
          <span className="text-sm text-gray-700">{label || "Working..."}</span>
        </div>
      </div>
    ) : null;

  const Badge = ({ tone = "slate", children }) => (
    <span
      className={`rounded-full bg-${tone}-50 px-2 py-0.5 text-[10px] font-medium text-${tone}-700`}
    >
      {children}
    </span>
  );

  // Tailwind dynamic class caveat: if using strict purge, whitelist the tones or inline two variants below

  // -------------------- Render --------------------
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"Product Tracking"}
      closeName={"tracking"}
    >
      <div className="relative">
        <Overlay show={loading} label="Loading products..." />

        <div className="p-4">
          {banner && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {banner}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Search bar */}
          <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20 md:max-w-md"
                placeholder="Search by name or ID"
              />
              <div className="text-xs text-gray-500">
                Leave the limit blank to remove tracking.
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="h-[60vh] overflow-auto rounded-2xl border border-gray-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-2 border">Product Name</th>
                  <th className="px-4 py-2 border">Product ID</th>
                  <th className="px-4 py-2 border">Tracking Limit</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No results
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isEditing = editingProductId === p.PRODUCT_ID;
                    const tone = p.MIN_LIMIT != null ? "emerald" : "slate";
                    return (
                      <tr
                        key={p.PRODUCT_ID}
                        className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-4 py-2 border text-gray-900">
                          {p.NAME}
                        </td>
                        <td className="px-4 py-2 border font-mono text-xs text-gray-700">
                          {p.PRODUCT_ID}
                        </td>
                        <td
                          className={`px-4 py-2 border ${
                            isEditing ? "bg-amber-50" : ""
                          }`}
                          onClick={() =>
                            !isEditing && beginEdit(p.PRODUCT_ID, p.MIN_LIMIT)
                          }
                          title={isEditing ? "Editing" : "Click to edit"}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              step="1"
                              min="0"
                              value={draftQuantity}
                              onChange={(e) => setDraftQuantity(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commit(p.PRODUCT_ID);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                              autoFocus
                            />
                          ) : p.MIN_LIMIT != null ? (
                            <span className="font-medium text-gray-900">
                              {p.MIN_LIMIT}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not tracked</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border">
                          <Badge tone={tone}>
                            {p.MIN_LIMIT != null ? "Tracked" : "Not tracked"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 border text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                onClick={() => commit(p.PRODUCT_ID)}
                                disabled={busyId === p.PRODUCT_ID}
                              >
                                {busyId === p.PRODUCT_ID ? (
                                  <>
                                    <Spinner /> Saving
                                  </>
                                ) : (
                                  "Commit Change"
                                )}
                              </button>
                              <button
                                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                              onClick={() =>
                                beginEdit(p.PRODUCT_ID, p.MIN_LIMIT)
                              }
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
