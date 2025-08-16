import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import { format, isAfter, parseISO } from "date-fns";

const http = new http_handler();

/**
 * ProductHistory — Professional UI/UX refactor
 * - Searchable product picker modal (filters by NAME/ID; TYPE ∈ {122, 44})
 * - Date-range inputs with validation
 * - Fetch history with overlay + banners (no alerts)
 * - Fullscreen overlay showing grouped-by-day transactions
 * - Compact stock tables for before/after snapshots
 */
export default function ProductHistory(props) {
  const { visible, closeHandler } = props;

  // Data
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [productHistory, setProductHistory] = useState([]);

  // UI state
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyOverlayVisible, setHistoryOverlayVisible] = useState(false);

  const [startRange, setStartRange] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endRange, setEndRange] = useState(format(new Date(), "yyyy-MM-dd"));

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  // -------------------- Init --------------------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await http.getProducts();
        const sorted = (res?.data || []).sort((a, b) =>
          String(a.NAME || "").localeCompare(String(b.NAME || ""))
        );
        const filtered = sorted.filter(
          (p) => p.TYPE === "122" || p.TYPE === "44"
        );
        setProducts(filtered);
        setFilteredProducts(filtered);
      } catch (e) {
        setError(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  // -------------------- Derived --------------------
  const groupedHistory = useMemo(() => {
    const acc = {};
    for (const entry of productHistory) {
      const dayKey = format(new Date(entry.DATE), "yyyy-MM-dd");
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(entry);
    }
    return acc; // { '2025-08-14': [entry, ...], ... }
  }, [productHistory]);

  const totalTransactions = useMemo(
    () => productHistory.length,
    [productHistory]
  );

  // -------------------- Handlers --------------------
  const openPicker = () => {
    setProductModalVisible(true);
    setSearchQuery("");
    setFilteredProducts(products);
  };

  const handleSearchChange = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    setFilteredProducts(
      products.filter(
        (p) =>
          String(p.NAME || "")
            .toLowerCase()
            .includes(q) ||
          String(p.PRODUCT_ID || "")
            .toLowerCase()
            .includes(q)
      )
    );
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductModalVisible(false);
    setBanner("");
    setError("");
  };

  const validateRange = () => {
    const start = parseISO(startRange);
    const end = parseISO(endRange);
    if (isAfter(start, end)) {
      setError("Start date must be on or before end date");
      return false;
    }
    return true;
  };

  const fetchProductHistory = async () => {
    if (!selectedProduct) {
      setError("Please select a product first");
      return;
    }
    if (!validateRange()) return;

    setFetching(true);
    setError("");
    setBanner("");

    try {
      const range = { start: startRange, end: endRange };
      const history = await http.getProductHistory(
        selectedProduct.PRODUCT_ID,
        range
      );

      if (
        history?.status &&
        Array.isArray(history?.data) &&
        history.data.length > 0
      ) {
        setProductHistory(history.data);
        setHistoryOverlayVisible(true);
      } else {
        setProductHistory([]);
        setHistoryOverlayVisible(false);
        setBanner("No product transactions in the specified date range.");
      }
    } catch (e) {
      setError(
        e?.message || "An error occurred while fetching product history"
      );
    } finally {
      setFetching(false);
    }
  };

  // -------------------- UI helpers --------------------
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
  // If Tailwind purge is strict, whitelist these classes or inline variants.

  const StockTable = ({ data }) => (
    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2">Product Name</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Stored</th>
            <th className="px-3 py-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 text-gray-900">{row.product_name}</td>
              <td className="px-3 py-2">{row.stock}</td>
              <td className="px-3 py-2">{row.stored}</td>
              <td className="px-3 py-2">{row.active}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const DaySection = ({ dayKey, entries }) => (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold text-gray-800">
        {format(new Date(dayKey), "eeee, MMMM do, yyyy")}
      </h3>
      <div className="divide-y divide-gray-200">
        {entries.map((entry, i) => (
          <div key={`${entry.TRANSACTIONID}-${i}`} className="py-3">
            <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="text-sm text-gray-700">
                <div>
                  <span className="font-medium">Transaction:</span>{" "}
                  {entry.TRANSACTIONID}
                </div>
                <div>
                  <span className="font-medium">Protocol:</span> {entry.ACTION}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <div>
                  <span className="font-medium">Employee:</span>{" "}
                  {entry.EMPLOYEE_NAME}
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {format(new Date(entry.DATE), "yyyy-MM-dd HH:mm:ss")}
                </div>
              </div>
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {Number(entry.REVERSED) === 0 ? (
                  <Badge tone="emerald">Committed</Badge>
                ) : (
                  <Badge tone="rose">Error & Reverted</Badge>
                )}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Product:</span>{" "}
                {entry.PRODUCT_NAME}
              </div>
              <div>
                <span className="font-medium">Source Quantity:</span>{" "}
                {entry.QUANTITY}
              </div>
            </div>

            {Array.isArray(entry.before_stock) &&
              entry.before_stock.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Before Stock
                  </div>
                  <StockTable data={entry.before_stock} />
                </div>
              )}
            {Array.isArray(entry.after_stock) &&
              entry.after_stock.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    After Stock
                  </div>
                  <StockTable data={entry.after_stock} />
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );

  const HistoryOverlay = ({ visible, onClose }) => {
    if (!visible) return null;
    const days = Object.keys(groupedHistory).sort(
      (a, b) => new Date(b) - new Date(a)
    );
    return (
      <div className="fixed inset-0 z-50 bg-black/50 p-4">
        <div className="relative mx-auto h-full w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {selectedProduct?.NAME}
              </div>
              <div className="text-xs text-gray-500">
                ID:{" "}
                <span className="font-mono">{selectedProduct?.PRODUCT_ID}</span>{" "}
                • Range: {startRange} → {endRange} • Transactions:{" "}
                {totalTransactions}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
          <div className="h-[75vh] overflow-auto p-4">
            {days.length === 0 ? (
              <div className="grid place-items-center py-20 text-sm text-gray-500">
                No history
              </div>
            ) : (
              days.map((dayKey) => (
                <DaySection
                  key={dayKey}
                  dayKey={dayKey}
                  entries={groupedHistory[dayKey]}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // -------------------- Render --------------------
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"Product History"}
      closeName={"productHistory"}
    >
      <div className="relative">
        <Overlay
          show={loading || fetching}
          label={loading ? "Loading products..." : "Fetching history..."}
        />

        <div className="p-4">
          {banner && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {banner}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  value={startRange}
                  onChange={(e) => setStartRange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  value={endRange}
                  onChange={(e) => setEndRange(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                onClick={openPicker}
              >
                {selectedProduct ? "Change Product" : "Select Product"}
              </button>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {selectedProduct ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{selectedProduct.NAME}</span>
                    <span className="font-mono text-xs text-gray-500">
                      {selectedProduct.PRODUCT_ID}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">No product selected</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                onClick={fetchProductHistory}
                disabled={fetching}
              >
                {fetching ? (
                  <>
                    <Spinner /> Fetching
                  </>
                ) : (
                  "Fetch History"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Product Picker Modal */}
        <BaseModal
          visible={productModalVisible}
          closeHandler={() => setProductModalVisible(false)}
          title={"Select Product"}
        >
          <div className="p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products by name or ID..."
              className="mb-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
            />
            <div className="max-h-80 overflow-auto rounded-2xl border border-gray-200">
              {filteredProducts.length === 0 ? (
                <div className="grid place-items-center p-6 text-sm text-gray-500">
                  No results
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <li
                      key={product.PRODUCT_ID}
                      className={`cursor-pointer px-3 py-2 hover:bg-gray-50 ${
                        selectedProduct?.PRODUCT_ID === product.PRODUCT_ID
                          ? "bg-blue-50"
                          : "bg-white"
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {product.NAME}
                          </div>
                          <div className="truncate font-mono text-[11px] text-gray-500">
                            {product.PRODUCT_ID}
                          </div>
                        </div>
                        <Badge tone="indigo">{product.TYPE}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </BaseModal>

        {/* History Fullscreen Overlay */}
        <HistoryOverlay
          visible={historyOverlayVisible}
          onClose={() => setHistoryOverlayVisible(false)}
        />
      </div>
    </BaseModal>
  );
}
