import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * OverrideStock — Professional refactor
 * - Adds Pool Ref column (null | poolID)
 * - Disables STORED_STOCK edits when product is linked to a virtual pool (poolRef present)
 * - Streamlined UI, sticky search bar, clear badges & statuses
 */
export default function OverrideStock(props) {
  const { visible, closeHandler } = props;

  const [products, setProducts] = useState([]); // products with poolRef
  const [inventoryMap, setInventoryMap] = useState(new Map()); // PRODUCT_ID -> { ACTIVE_STOCK, STORED_STOCK }

  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingField, setEditingField] = useState(null); // "STORED_STOCK" | "ACTIVE_STOCK"
  const [quantity, setQuantity] = useState("");

  const [changeMessage, setChangeMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Extra params modal state
  const [showExtraParamsModal, setShowExtraParamsModal] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [errorRangeDates, setErrorRangeDates] = useState({
    start: null,
    end: null,
  });
  const [category, setCategory] = useState("");
  const [errorCauseType, setErrorCauseType] = useState("employee");
  const [extraParamsError, setExtraParamsError] = useState("");

  // -------------------- Init --------------------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const productInventory = await http.getProductsInventory();
        const invMap = new Map(
          (productInventory?.data || []).map((item) => [item.PRODUCT_ID, item])
        );
        setInventoryMap(invMap);

        const productsRes = await http.getProducts();
        const formatted = (productsRes?.data || []).map((p) => ({
          ...p,
          focus: false,
        }));
        setProducts(formatted);
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
      // Block edits to stored stock for virtual-linked products
      setChangeMessage(
        `\u26A0\uFE0F ${product.NAME} uses Virtual Stock via pool ${product.poolRef}. STORED_STOCK is managed by the pool and cannot be edited here.`
      );
      return;
    }
    setEditingProductId(product.PRODUCT_ID);
    setEditingField(field);

    const current =
      field === "STORED_STOCK"
        ? inventoryMap.get(product.PRODUCT_ID)?.STORED_STOCK
        : inventoryMap.get(product.PRODUCT_ID)?.ACTIVE_STOCK;

    const safe =
      typeof current === "number" && !Number.isNaN(current) ? current : 0;
    setQuantity(String(safe.toFixed(2)));
  };

  const handleUpdateStock = () => {
    if (!quantity || !editingField || !editingProductId) {
      setChangeMessage("Fields cannot be empty");
      return;
    }
    setShowExtraParamsModal(true);
  };

  const handleSubmitExtraParams = async () => {
    if (
      !explanation ||
      !errorRangeDates.start ||
      !errorRangeDates.end ||
      !category ||
      !errorCauseType
    ) {
      setExtraParamsError("All fields are required");
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
      setExtraParamsError("Quantity must be a number");
      return;
    }

    const difference = target - before;

    const data = {
      PRODUCT_ID: productId,
      QUANTITY: difference,
      explanation,
      errorRangeDates,
      category,
      errorCauseType,
      beforeUpdateStock: before,
    };

    setLoading(true);
    try {
      await http.updateStock(data, field === "STORED_STOCK");
      setInventoryMap((prev) => {
        const updated = new Map(prev);
        const item = { ...(updated.get(productId) || {}) };
        if (field === "STORED_STOCK") item.STORED_STOCK = target;
        else item.ACTIVE_STOCK = target;
        updated.set(productId, item);
        return updated;
      });

      const name =
        products.find((p) => p.PRODUCT_ID === productId)?.NAME || productId;
      setChangeMessage(`Stock changed for ${name} to ${target.toFixed(2)}`);
    } finally {
      setLoading(false);
      setEditingProductId(null);
      setEditingField(null);
      setQuantity("");
      setShowExtraParamsModal(false);
      setExplanation("");
      setErrorRangeDates({ start: null, end: null });
      setCategory("");
      setErrorCauseType("employee");
      setExtraParamsError("");
    }
  };

  // -------------------- UI --------------------
  const Row = ({ product, index, modalOpen = false }) => {
    const inv = inventoryMap.get(product.PRODUCT_ID) || {};
    const isVirtual = isVirtualLinked(product);
    const isEditingStored =
      editingField === "STORED_STOCK" &&
      editingProductId === product.PRODUCT_ID;
    const isEditingActive =
      editingField === "ACTIVE_STOCK" &&
      editingProductId === product.PRODUCT_ID;

    return (
      <tr className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
        <td className="px-4 py-2 border text-gray-900">{product.NAME}</td>
        <td className="px-4 py-2 border font-mono text-xs text-gray-700">
          {product.PRODUCT_ID}
        </td>
        <td className="px-4 py-2 border text-gray-900">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-gray-600">
              {product.poolRef || "—"}
            </span>
            {isVirtual ? (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                Virtual
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Direct
              </span>
            )}
          </div>
        </td>
        {/* STORED_STOCK */}
        <td
          className={`px-4 py-2 border ${
            isVirtual
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:bg-amber-50"
          }`}
          onClick={() => {
            if (!isVirtual) handleEditClick(product, "STORED_STOCK");
          }}
          title={isVirtual ? "Managed by Virtual Pool" : "Click to edit"}
        >
          {isEditingStored ? (
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:ring-2 focus:ring-gray-900/20"
              autoFocus={!modalOpen}
            />
          ) : typeof inv.STORED_STOCK === "number" ? (
            <p style={{ color: "black" }}> {inv.STORED_STOCK.toFixed(2)}</p>
          ) : (
            "N/A"
          )}
        </td>
        {/* ACTIVE_STOCK */}
        <td
          className={`px-4 py-2 border cursor-pointer hover:bg-amber-50`}
          onClick={() => handleEditClick(product, "ACTIVE_STOCK")}
          title="Click to edit"
        >
          {isEditingActive ? (
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:ring-2 focus:ring-gray-900/20"
              autoFocus={!modalOpen}
            />
          ) : typeof inv.ACTIVE_STOCK === "number" ? (
            <p style={{ color: "black" }}>inv.ACTIVE_STOCK.toFixed(2)</p>
          ) : (
            "N/A"
          )}
        </td>
        <td className="px-4 py-2 border text-right">
          {editingProductId === product.PRODUCT_ID ? (
            <button
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
              onClick={handleUpdateStock}
            >
              Commit Change
            </button>
          ) : (
            <span className="text-xs text-gray-500">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
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
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                <span className="text-sm text-gray-700">Loading...</span>
              </div>
            </div>
          )}

          <div className="p-4">
            {changeMessage && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {changeMessage}
              </div>
            )}

            <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-gray-100 bg-white px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20 md:max-w-md"
                  placeholder="Search by name or ID"
                />
                <div className="text-xs text-gray-500">
                  Tip: Products linked to a pool show a{" "}
                  <span className="rounded bg-indigo-50 px-1 py-0.5 font-medium text-indigo-700">
                    Virtual
                  </span>{" "}
                  badge and their Stored Stock is locked.
                </div>
              </div>
            </div>

            <div className="h-[55vh] overflow-auto rounded-2xl border border-gray-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-gray-600">
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
                    <Row
                      key={p.PRODUCT_ID}
                      product={p}
                      index={idx}
                      modalOpen={showExtraParamsModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </BaseModal>

      {showExtraParamsModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Additional Information Required
            </h2>
            {extraParamsError && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {extraParamsError}
              </div>
            )}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Explanation
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Error Range Start
                </label>
                <input
                  type="datetime-local"
                  value={errorRangeDates.start || ""}
                  onChange={(e) =>
                    setErrorRangeDates((s) => ({ ...s, start: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Error Range End
                </label>
                <input
                  type="datetime-local"
                  value={errorRangeDates.end || ""}
                  onChange={(e) =>
                    setErrorRangeDates((s) => ({ ...s, end: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>
            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Error Cause Type
                </label>
                <select
                  value={errorCauseType}
                  onChange={(e) => setErrorCauseType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/20"
                >
                  <option value="employee">Employee</option>
                  <option value="operation">Operation</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                onClick={handleSubmitExtraParams}
              >
                Submit
              </button>
              <button
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setShowExtraParamsModal(false);
                  setExtraParamsError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
