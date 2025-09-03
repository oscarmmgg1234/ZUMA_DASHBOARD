import React, { useEffect, useMemo, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

// ---------- Small UI helpers ----------
const Spinner = () => (
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />
);

const CellFlash = ({ cellKey, children }) => (
  <span
    key={cellKey}
    className="inline-block rounded px-1 transition-[background-color] duration-700 bg-emerald-200 text-black"
  >
    {children}
  </span>
);

// Accessible searchable dropdown (same spirit as your ViewInventory)
const DropdownButton = ({ id, setData, dataValue, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o).toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((s) => !s)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-black/30 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span className="truncate">{dataValue}</span>
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-black/20 bg-white shadow-lg">
          <div className="p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter..."
              className="w-full rounded-lg border border-black/30 bg-white px-2 py-1 text-sm text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <ul id={id} role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-black/70">No results</li>
            ) : (
              filtered.map((option, idx) => (
                <li key={`${option}-${idx}`}>
                  <button
                    onClick={() => {
                      setData(option);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-50 ${
                      option === dataValue ? "bg-gray-100 font-semibold" : ""
                    }`}
                    role="option"
                    aria-selected={option === dataValue}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------- MAIN ----------
export default function OverrideStock(props) {
  const { visible, closeHandler } = props;

  // data
  const [products, setProducts] = useState([]); // { PRODUCT_ID, NAME, TYPE, COMPANY, poolRef? }
  const [inventoryMap, setInventoryMap] = useState(new Map()); // PRODUCT_ID -> { ACTIVE_STOCK, STORED_STOCK }

  // filters (same shape as ViewInventory)
  const [filterOptions, setFilterOptions] = useState([]); // ["ALL PRODUCTS", company labels...]
  const [filterMeta, setFilterMeta] = useState([]); // [{label,value,typeID}]
  const [productTypes, setProductTypes] = useState([]); // [{ id, label }]
  const [selectedFilter, setSelectedFilter] = useState("ALL PRODUCTS");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL TYPES");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  // editing
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingField, setEditingField] = useState(null); // "STORED_STOCK" | "ACTIVE_STOCK"
  const [quantity, setQuantity] = useState("");
  const [rowSavingId, setRowSavingId] = useState(null);
  const [flashCellKey, setFlashCellKey] = useState("");

  // ---------- init / fetch ----------
  const getCompanies = async () => {
    const companies = await http.getPartnerCompanies();
    const companyOptions = companies.data.map((c) => ({
      label: c.NAME,
      value: false,
      typeID: c.COMPANY_ID,
    }));
    companyOptions.unshift({ label: "ALL PRODUCTS", value: true, typeID: "0" });
    setFilterMeta(companyOptions);
    setFilterOptions(companyOptions.map((x) => x.label));
  };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await getCompanies();

        const productTypesRes = await http.getProductTypes();
        const types = productTypesRes.data.map((t) => ({
          id: t.TYPE_ID,
          label: t.TYPE,
        }));
        setProductTypes(types);
        setSelectedTypeFilter("ALL TYPES");

        const productInventory = await http.getProductsInventory();
        const invMap = new Map(
          (productInventory?.data || []).map((item) => [item.PRODUCT_ID, item])
        );
        setInventoryMap(invMap);

        const productsRes = await http.getProducts();
        // ensure product objects contain COMPANY (id) and TYPE (id) to match filters
        const formatted = (productsRes?.data || []).map((p) => ({ ...p }));
        setProducts(formatted);
      } catch (e) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  // ---------- filter + sort ----------
  const filteredProducts = useMemo(() => {
    let data = [...products];

    // company filter
    if (selectedFilter !== "ALL PRODUCTS") {
      const selected = filterMeta.find((f) => f.label === selectedFilter);
      if (selected) {
        data = data.filter(
          (p) => String(p.COMPANY) === String(selected.typeID)
        );
      }
    }

    // type filter
    if (selectedTypeFilter !== "ALL TYPES") {
      const t = productTypes.find((x) => x.label === selectedTypeFilter);
      if (t) {
        data = data.filter((p) => String(p.TYPE) === String(t.id));
      }
    }

    // search by name or id
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (p) =>
          String(p.NAME || "")
            .toLowerCase()
            .includes(q) ||
          String(p.PRODUCT_ID || "")
            .toLowerCase()
            .includes(q)
      );
    }

    // sort by name
    data.sort((a, b) =>
      sortOrder === "ASC"
        ? a.NAME.localeCompare(b.NAME)
        : b.NAME.localeCompare(a.NAME)
    );

    return data;
  }, [
    products,
    filterMeta,
    productTypes,
    selectedFilter,
    selectedTypeFilter,
    sortOrder,
    searchQuery,
  ]);

  // ---------- helpers ----------
  const isVirtualLinked = (product) => !!product?.poolRef;

  const handleEditClick = (product, field) => {
    if (field === "STORED_STOCK" && isVirtualLinked(product)) {
      setBanner(
        `⚠️ ${product.NAME} uses Virtual Stock (pool ${product.poolRef}). Stored stock is locked.`
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
      typeof current === "number" && Number.isFinite(current) ? current : 0;
    setQuantity(String(safe)); // no rounding
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
      typeof currentStock === "number" && Number.isFinite(currentStock)
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

      // optimistic update
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

  // ---------- row ----------
  const Row = ({ product, index }) => {
    const inv = inventoryMap.get(product.PRODUCT_ID) || {};
    const saving = rowSavingId === product.PRODUCT_ID;

    const isEditingStored =
      editingField === "STORED_STOCK" &&
      editingProductId === product.PRODUCT_ID;
    const isEditingActive =
      editingField === "ACTIVE_STOCK" &&
      editingProductId === product.PRODUCT_ID;

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

    const isVirtual = isVirtualLinked(product);

    return (
      <tr
        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${
          saving ? "animate-pulse" : ""
        }`}
      >
        <td className="px-4 py-2 border text-black">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{product.NAME}</span>
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
          <div className="font-mono text-[11px] text-black/70">
            {product.PRODUCT_ID}
          </div>
        </td>
        <td className="px-4 py-2 border font-mono text-xs text-black">
          {product.poolRef || "—"}
        </td>

        {/* STORED */}
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
              className="w-full rounded-md border border-black/30 px-2 py-1 text-black focus:ring-2 focus:ring-black/20"
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

        {/* ACTIVE */}
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
              className="w-full rounded-md border border-black/30 px-2 py-1 text-black focus:ring-2 focus:ring-black/20"
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

          {/* Controls row (filters like ViewInventory) */}
          <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-black/10 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/30 px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20 md:max-w-md"
                placeholder="Search by name or ID"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-black/70">Company</label>
                <DropdownButton
                  id="company-filter"
                  setData={setSelectedFilter}
                  dataValue={selectedFilter}
                  options={filterOptions}
                />
                <label className="ml-2 text-xs text-black/70">Type</label>
                <DropdownButton
                  id="type-filter"
                  setData={setSelectedTypeFilter}
                  dataValue={selectedTypeFilter}
                  options={["ALL TYPES", ...productTypes.map((t) => t.label)]}
                />
                <label className="ml-2 text-xs text-black/70">Sort</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-24 rounded-xl border border-black/30 bg-white px-2 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="ASC">A–Z</option>
                  <option value="DESC">Z–A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="h-[60vh] overflow-auto rounded-2xl border border-black/20">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-black">
                <tr>
                  <th className="px-4 py-2 border">Product</th>
                  <th className="px-4 py-2 border">Pool Ref</th>
                  <th className="px-4 py-2 border">Stored Stock</th>
                  <th className="px-4 py-2 border">Active Stock</th>
                  <th className="px-4 py-2 border text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-black/60"
                    >
                      No results
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <Row key={p.PRODUCT_ID} product={p} index={idx} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
