import Tooltip from "@mui/material/Tooltip";
import React, { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

// --------------------------- UI HELPERS ---------------------------
const Spinner = () => (
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
);

const Overlay = ({ show, label }) =>
  show ? (
    <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow">
        <Spinner />
        <span className="text-sm text-gray-700">{label || "Working..."}</span>
      </div>
    </div>Finput
  ) : null;

const Badge = ({ tone = "slate", children }) => (
  <span
    className={`rounded-full bg-${tone}-50 px-2 py-0.5 text-[10px] font-medium text-${tone}-700`}
  >
    {children}
  </span>
);
// If Tailwind purge is strict, whitelist these classes or inline fixed variants.

// Accessible dropdown with outside-click handling per instance
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
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter..."
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>
          <ul id={id} role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No results</li>
            ) : (
              filtered.map((option, idx) => (
                <li key={`${option}-${idx}`}>
                  <button
                    onClick={() => {
                      setData(option);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
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

// --------------------------- MAIN COMPONENT ---------------------------
export default function ViewInventoryModal(props) {
  const { visible, closeHandler } = props;

  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [filter, setFilter] = useState([]); // companies [{label, value, typeID}]
  const [productTypes, setProductTypes] = useState([]); // [{id, label}]
  const [filterOptions, setFilterOptions] = useState([]); // company labels

  const [selectedFilter, setSelectedFilter] = useState("ALL PRODUCTS");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL TYPES");
  const [sortOrder, setSortOrder] = useState("ASC");

  const [metrics, setMetrics] = useState(new Map());

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printFilter, setPrintFilter] = useState({
    company: "ALL PRODUCTS",
    type: "ALL TYPES",
    sort: "ASC",
  });

  // --------------------------- Fetchers ---------------------------
  const getCompanies = async () => {
    const companies = await http.getPartnerCompanies();
    const companyOptions = companies.data.map((company) => ({
      label: company.NAME,
      value: false,
      typeID: company.COMPANY_ID,
    }));
    companyOptions.unshift({ label: "ALL PRODUCTS", value: true, typeID: "0" });
    setFilter(companyOptions);
    setFilterOptions(companyOptions.map((item) => item.label));
  };

  const init = async () => {
    setLoading(true);
    setError("");
    setBanner("");
    try {
      await getCompanies();

      const productTypesRes = await http.getProductTypes();
      const types = productTypesRes.data.map((type) => ({
        id: type.TYPE_ID,
        label: type.TYPE,
      }));
      setProductTypes(types);
      setSelectedTypeFilter("ALL TYPES");

      const metricsRes = await http.getGlobalMetrics();
      const metric_map = new Map();
      metricsRes.perHourMonthTimeFrame.forEach((item) => {
        const rate = parseFloat(item.total);
        metric_map.set(item.product_id, rate > 0 ? rate : 0);
      });
      setMetrics(metric_map);

      const productInventory = await http.getProductsInventory();
      const inventoryMap = new Map(
        productInventory.data.map((item) => [item.PRODUCT_ID, item])
      );
      const products = await http.getProducts();
      const productFilterMap = new Map(
        products.data.map((p) => [p.PRODUCT_ID, p])
      );

      const formatted = products.data.map((p) => {
        const inv = inventoryMap.get(p.PRODUCT_ID) || {};
        const productLimit = productFilterMap.get(p.PRODUCT_ID);
        const isBelow =
          productLimit?.MIN_LIMIT != null &&
          inv?.STORED_STOCK <= productLimit.MIN_LIMIT;
        return { ...p, focus: false, alert: isBelow, ...inv };
      });

      setInventory(formatted);
    } catch (e) {
      setError(e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // --------------------------- Filtering/Sorting ---------------------------
  const sortAndFilterInventory = (
    query,
    data,
    companyFilter,
    typeFilter,
    order
  ) => {
    let filtered = [...data];

    // Company filter
    if (companyFilter !== "ALL PRODUCTS") {
      const selectedOption = filter.find(
        (item) => item.label === companyFilter
      );
      if (selectedOption)
        filtered = filtered.filter(
          (item) => item.COMPANY === selectedOption.typeID
        );
    }

    // Type filter
    if (typeFilter !== "ALL TYPES") {
      const selectedType = productTypes.find(
        (item) => item.label === typeFilter
      );
      if (selectedType)
        filtered = filtered.filter((item) => item.TYPE === selectedType.id);
    }

    // Search filter (name or id)
    if (query !== "") {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item.NAME || "")
            .toLowerCase()
            .includes(q) ||
          String(item.PRODUCT_ID || "")
            .toLowerCase()
            .includes(q)
      );
    }

    // Sort (by name)
    filtered.sort((a, b) =>
      order === "ASC"
        ? a.NAME.localeCompare(b.NAME)
        : b.NAME.localeCompare(a.NAME)
    );

    setFilteredInventory(filtered);
  };

  useEffect(() => {
    sortAndFilterInventory(
      searchQuery,
      inventory,
      selectedFilter,
      selectedTypeFilter,
      sortOrder
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, inventory, selectedFilter, selectedTypeFilter, sortOrder]);

  const refresh_handler = () => init();

  // --------------------------- Print ---------------------------
  const print_handler = async (pf) => {
    setIsLoadingPdf(true);
    setError("");
    try {
      let requestData = {};
      const selectedCompany = filter.find(
        (item) => item.label === pf.company
      ) || { label: "ALL PRODUCTS", typeID: "0" };
      const selectedType = productTypes.find((item) => item.label === pf.type);

      const headers = { "Content-Type": "application/json" };

      if (selectedCompany.label !== "ALL PRODUCTS" && selectedType) {
        requestData = {
          company: selectedCompany.typeID,
          type: selectedType.id,
          sortOrder: pf.sort,
        };
        const pdf = await fetch("http://192.168.1.248:3001/genPdfSpecific", {
          method: "POST",
          headers,
          body: JSON.stringify(requestData),
        });
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        if (pdfWindow) pdfWindow.onload = () => URL.revokeObjectURL(pdfUrl);
      } else if (
        selectedCompany.label !== "ALL PRODUCTS" &&
        !selectedType?.id
      ) {
        requestData = {
          company: { company: selectedCompany.typeID, sortOrder: pf.sort },
        };
        const pdf = await fetch(
          "http://192.168.1.248:3001/gen_inv_pdf_by_company",
          { method: "POST", headers, body: JSON.stringify(requestData) }
        );
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        if (pdfWindow) pdfWindow.onload = () => URL.revokeObjectURL(pdfUrl);
      } else {
        requestData = {
          company: { company: selectedCompany.typeID, sortOrder: pf.sort },
        };
        const pdf = await fetch("http://192.168.1.248:3001/gen_inv_pdf_A4", {
          method: "POST",
          headers,
          body: JSON.stringify(requestData),
        });
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        if (pdfWindow) pdfWindow.onload = () => URL.revokeObjectURL(pdfUrl);
      }
      setBanner(
        "PDF generated. If a new tab didn't open, please allow popups for this site."
      );
    } catch (err) {
      console.log(err);
      setError("Failed to generate PDF");
    }
    setIsLoadingPdf(false);
  };

  // --------------------------- Memoized table rows ---------------------------
  const rows = useMemo(
    () =>
      filteredInventory.map((product, index) => {
        const rate = metrics.get(product.PRODUCT_ID) || 0;
        return (
          <tr
            key={product.PRODUCT_ID}
            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${
              product.alert ? "bg-rose-100" : ""
            } hover:bg-gray-50`}
            onClick={() => setSelectedProduct(product)}
          >
            <td className="px-4 py-2 border text-gray-900">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{product.NAME}</span>
                {product.alert ? (
                  <Badge tone="rose">Below limit</Badge>
                ) : (
                  <span className="text-xs text-gray-400">&nbsp;</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-gray-500">
                {product.PRODUCT_ID}
              </div>
            </td>
            <Tooltip title="Total Stock" placement="left" arrow>
              <td className="px-4 py-2 border text-gray-900 font-semibold bg-gray-50">
                {Number.isFinite(product.STOCK)
                  ? Math.round(product.STOCK)
                  : "N/A"}
              </td>
            </Tooltip>
            <Tooltip title="Active Stock" placement="left" arrow>
              <td className="px-4 py-2 border text-gray-900">
                {Number.isFinite(product.ACTIVE_STOCK)
                  ? Math.round(product.ACTIVE_STOCK)
                  : "N/A"}
              </td>
            </Tooltip>
            <Tooltip title="Stored Stock" placement="left" arrow>
              <td className="px-4 py-2 border text-gray-900">
                {Number.isFinite(product.STORED_STOCK)
                  ? Math.round(product.STORED_STOCK)
                  : "N/A"}
              </td>
            </Tooltip>
            <td className="px-4 py-2 border text-gray-900">
              {rate === 0 ? "N/A" : rate}
            </td>
          </tr>
        );
      }),
    [filteredInventory, metrics]
  );

  // --------------------------- Render ---------------------------
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"View Inventory"}
      closeName={"viewInv"}
    >
      <div className="relative">
        <Overlay show={loading} label="Loading inventory..." />

        <div className="p-4 flex flex-col h-full">
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

          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              onClick={refresh_handler}
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Refresh
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-600">Company</label>
              <DropdownButton
                id="company-filter"
                setData={setSelectedFilter}
                dataValue={selectedFilter}
                options={filterOptions}
              />
              <label className="ml-2 text-xs text-gray-600">Type</label>
              <DropdownButton
                id="type-filter"
                setData={setSelectedTypeFilter}
                dataValue={selectedTypeFilter}
                options={["ALL TYPES", ...productTypes.map((t) => t.label)]}
              />
              <label className="ml-2 text-xs text-gray-600">Sort</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-24 rounded-xl border border-gray-300 px-2 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                <option value="ASC">A–Z</option>
                <option value="DESC">Z–A</option>
              </select>
            </div>
            <button
              onClick={() => setPrintModalOpen(true)}
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Print
            </button>
          </div>

          <div className="h-[72vh] overflow-auto rounded-2xl border border-gray-200">
            <div className="sticky top-0 z-[1] -mx-4 border-b border-gray-100 bg-white px-4 py-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Search by product name or ID"
              />
            </div>
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-[52px] bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-2 border">Product</th>
                  <th className="px-4 py-2 border">Total Stock</th>
                  <th className="px-4 py-2 border">Active Stock</th>
                  <th className="px-4 py-2 border">Stored Stock</th>
                  <th className="px-4 py-2 border">
                    {"Today's Reduction Rate (hr/day)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No results
                    </td>
                  </tr>
                ) : (
                  rows
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Modal */}
        {printModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Confirm Print
              </h2>

              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Company
                  </label>
                  <DropdownButton
                    id="print-company"
                    setData={(val) =>
                      setPrintFilter((prev) => ({ ...prev, company: val }))
                    }
                    dataValue={printFilter.company}
                    options={filterOptions}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Type
                  </label>
                  <DropdownButton
                    id="print-type"
                    setData={(val) =>
                      setPrintFilter((prev) => ({ ...prev, type: val }))
                    }
                    dataValue={printFilter.type}
                    options={["ALL TYPES", ...productTypes.map((t) => t.label)]}
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Sort
                  </label>
                  <select
                    value={printFilter.sort}
                    onChange={(e) =>
                      setPrintFilter((prev) => ({
                        ...prev,
                        sort: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-2 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  >
                    <option value="ASC">A–Z</option>
                    <option value="DESC">Z–A</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setPrintModalOpen(false);
                    await print_handler(printFilter);
                  }}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF overlay */}
        {isLoadingPdf && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
              <p className="text-sm font-medium text-white">
                Generating PDF...
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
