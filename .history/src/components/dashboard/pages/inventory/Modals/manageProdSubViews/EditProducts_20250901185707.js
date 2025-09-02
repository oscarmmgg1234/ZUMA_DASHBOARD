// EditProduct.jsx — full component with BarcodeGeneration toggle,
// delete flow, pool linking, node guide, and token test.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import NodeRenderer from "./node/NodeRenderer";
import http_handler from "../../HTTP/HTTPS_INTERFACE";
// NOTE: adjust the import path if your file is named differently
import NodeFlowGuide from "./node/NodeFLowGuide"

const http = new http_handler();

// --- helpers to resolve pool links from tokens & state ---
const VOPS_WHITELIST = new Set(["4i57", "20", "20r4"]); // include all ops you use

// Normalize any truthy shape from DB to a strict boolean
const toBool = (v) => v === true || v === 1 || v === "1";

// --- token parsing helpers for pool links ---
function parsePoolLinkFromTokens(tokensStr) {
  const s = tokensStr ? String(tokensStr) : "";
  const tokens = s.split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const parts = t.split(":"); // VIRTUALOPS:<op>:<productID>:<poolID>
    if (parts.length >= 4 && /^VIRTUALOPS$/i.test(parts[0])) {
      const op = parts[1];
      if (VOPS_WHITELIST.has(op)) {
        return { op, productID: parts[2], poolID: parts[3] };
      }
    }
  }
  return null;
}

function resolveEffectivePoolId({
  selectedPoolId,
  selectedProduct,
  findCurrentLink,
}) {
  // 1) explicit user selection
  if (selectedPoolId) return selectedPoolId;

  // 2) parse from stored tokens (either activation or shipment)
  const fromAct = parsePoolLinkFromTokens(
    selectedProduct?.ACTIVATION_TOKEN
  )?.poolID;
  if (fromAct) return fromAct;
  const fromShp = parsePoolLinkFromTokens(
    selectedProduct?.SHIPMENT_TOKEN
  )?.poolID;
  if (fromShp) return fromShp;

  // 3) authoritative pools table (LINKED_PRODUCTS)
  const fromPools = findCurrentLink?.(selectedProduct?.PRODUCT_ID)?.poolID;
  if (fromPools) return fromPools;

  // 4) legacy shapes
  const legacy =
    selectedProduct?.poolRef?.poolID ??
    selectedProduct?.poolRef ??
    selectedProduct?.POOL_REF ??
    selectedProduct?.currentPoolRef ??
    null;

  return legacy || "";
}

// Lightweight modal
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          {children}
        </div>
      </div>
    </>
  );
}

const runtimeTestHandler = async (productID) => {
  // Open synchronously so popups aren't blocked
  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup blocked. Please allow popups for this site.");
    return;
  }

  // Temporary placeholder UI
  win.document.open();
  win.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Generating Test Report</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:0; height:100vh; display:grid; place-items:center; color:#111; }
          .wrap { text-align:center; }
          .spinner { width:42px; height:42px; border:4px solid #ddd; border-top-color:#4f46e5; border-radius:50%; animation:spin 1s linear infinite; margin:12px auto 0; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Generating Test Report…</h1>
          <div class="spinner"></div>
        </div>
      </body>
    </html>`);
  win.document.close();

  try {
    const html = await http.runtimeTest({ productID }); // API should return a string (res.text())

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    win.location.replace(url);

    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  } catch (err) {
    const esc = (s) =>
      String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    win.document.open();
    win.document.write(`<!doctype html><meta charset="utf-8" />
      <title>Report Error</title>
      <style>body{font-family:system-ui;padding:24px;color:#111}</style>
      <h1>Report Error</h1><pre>${esc(
        err?.stack || err?.message || err
      )}</pre>`);
    win.document.close();
  }
};

export default function EditProduct(props) {
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [editedFields, setEditedFields] = useState({});
  const [success, setSuccess] = useState(false);
  const productListRef = useRef(null);
  const rowRef = useRef(null);
  const previousSelectedProductIndex = useRef(null);
  const previousSelectedCompany = useRef("All");
  const [route, setRoute] = useState("activation");
  const [registry, setRegistry] = useState(null);
  const [refTrees, setRefTrees] = useState({
    activation: null,
    reduction: null,
    shipment: null,
  });

  // ==== Virtual pools state ====
  const [virtualPools, setVirtualPools] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [creatingPool, setCreatingPool] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [normalizeRatio, setNormalizeRatio] = useState(1);

  // ==== Delete confirmation state ====
  const [showDeleteWarn, setShowDeleteWarn] = useState(false); // step 1
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // step 2
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ===== Data load on mount =====
  useEffect(() => {
    (async () => {
      const companiesData = await props.api.getPartnerCompanies();
      setCompanies(companiesData.data || []);

      const products = await props.api.getProducts();
      setProductList(products.data || []);

      const productTypesData = await props.api.getProductTypes();
      setProductTypes(productTypesData.data || []);

      const fetchRegistry = await props.api.fetchRegistry();
      setRegistry(fetchRegistry);

      const pools = await http.getVirtualStockPools();
      setVirtualPools(pools.arr || []);
    })();
  }, [props.api]);

  // Refresh pools when changing selected product (keeps card honest)
  useEffect(() => {
    if (!selectedProduct) return;
    (async () => {
      const pools = await http.getVirtualStockPools();
      setVirtualPools(pools.arr || []);
    })();
  }, [selectedProduct]);

  // ===== List & selection helpers =====
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setEditedFields({
      TYPE: product.TYPE,
      COMPANY: product.COMPANY,
      NAME: product.NAME,
      UNIT_TYPE: product.UNIT_TYPE,
      LOCATION: product.LOCATION,
      // seed BarcodeGeneration as a strict boolean for UI
      BarcodeGeneration: toBool(product.BarcodeGeneration),
    });
    previousSelectedCompany.current = selectedCompany;
    setShowProductList(false);
    setSuccess(false);
  };

  const handleCompanyChange = (event) => setSelectedCompany(event.target.value);

  const filteredProducts = productList.filter((product) => {
    const matchesSearch = product.NAME?.toLowerCase().includes(
      searchQuery.toLowerCase()
    );
    const matchesCompany =
      selectedCompany === "All" || product.COMPANY === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const calculateScrollOffset = useCallback(() => {
    if (rowRef.current && productListRef.current) {
      const rowHeight = rowRef.current.clientHeight;
      const containerHeight = productListRef.current.clientHeight;
      const index = previousSelectedProductIndex.current;
      if (index !== null && index >= 0) {
        const offset = index * rowHeight - containerHeight / 2 + rowHeight / 2;
        productListRef.current.scrollTo({ top: offset, behavior: "smooth" });
      }
    }
  }, []);

  const toggleProductList = () => {
    setShowProductList((prev) => {
      if (!prev && previousSelectedProductIndex.current !== null) {
        setSelectedCompany(previousSelectedCompany.current);
        setTimeout(calculateScrollOffset, 0);
      }
      return !prev;
    });
  };

  const handleFieldChange = (field, value) =>
    setEditedFields((prev) => ({ ...prev, [field]: value }));

  const handleCommitChanges = async () => {
    const updates = [];

    for (const key of Object.keys(editedFields)) {
      if (key === "BarcodeGeneration") {
        const prev = toBool(selectedProduct?.BarcodeGeneration);
        const next = toBool(editedFields.BarcodeGeneration);
        if (prev !== next) {
          // send numeric 1/0 to be explicit for SQL tinyint(1)
          updates.push({ field: "BarcodeGeneration", value: next ? 1 : 0 });
        }
      } else if (editedFields[key] !== selectedProduct[key]) {
        updates.push({ field: key, value: editedFields[key] });
      }
    }

    if (updates.length === 0) return;

    const payload = {
      PRODUCT_ID: selectedProduct.PRODUCT_ID,
      updates,
      section: "form",
    };

    const response = await props.api.commitChanges(payload);
    if (response?.status === true) {
      // reflect saved changes locally; keep BarcodeGeneration shape consistent (1/0)
      setProductList((prevList) =>
        prevList.map((product) =>
          product.PRODUCT_ID === selectedProduct.PRODUCT_ID
            ? {
                ...product,
                ...editedFields,
                ...(updates.find((u) => u.field === "BarcodeGeneration")
                  ? {
                      BarcodeGeneration: updates.find(
                        (u) => u.field === "BarcodeGeneration"
                      ).value,
                    }
                  : {}),
              }
            : product
        )
      );

      setSelectedProduct((p) => ({
        ...p,
        ...editedFields,
        ...(updates.find((u) => u.field === "BarcodeGeneration")
          ? {
              BarcodeGeneration: updates.find(
                (u) => u.field === "BarcodeGeneration"
              ).value,
            }
          : {}),
      }));

      setSuccess(true);
    } else {
      console.error("Failed to update product");
    }
  };

  // ===== Pools: truth from LINKED_PRODUCTS (stringified JSON) =====
  const normID = (x) => (x == null ? "" : String(x).trim().toUpperCase());
  const parseLinkedProducts = (s) => {
    if (!s) return [];
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  // Authoritative link finder (pool name/id + ratio) for the selected product
  const findCurrentLink = React.useCallback(
    (productID) => {
      const needle = normID(productID);
      if (!needle || !Array.isArray(virtualPools)) return null;

      for (const pool of virtualPools) {
        const linked = parseLinkedProducts(pool?.LINKED_PRODUCTS);
        const hit = linked.find((lp) => normID(lp?.productID) === needle);
        if (hit) {
          return {
            poolID: String(pool.poolID || ""),
            poolName: pool.name || "",
            productID: hit.productID,
            ratio: Number(hit.normalizeRatio),
          };
        }
      }
      return null;
    },
    [virtualPools]
  );

  // Keep the ratio input synced to the real link
  useEffect(() => {
    if (!selectedProduct) return;
    const link = findCurrentLink(selectedProduct.PRODUCT_ID);
    if (link && Number.isFinite(link.ratio)) {
      setNormalizeRatio(link.ratio);
    }
  }, [selectedProduct, virtualPools, findCurrentLink]);

  const refreshPools = async () => {
    const pools = await http.getVirtualStockPools();
    setVirtualPools(pools.arr || []);
  };

  // ===== Delete helpers =====
  const refreshProducts = async () => {
    const products = await props.api.getProducts();
    setProductList(products.data || []);
  };

  const handleDeleteClick = () => {
    setDeleteError("");
    setShowDeleteWarn(true); // step 1
  };

  const proceedToFinalConfirm = () => {
    setShowDeleteWarn(false);
    setShowDeleteConfirm(true); // step 2
  };

  const cancelDeleteFlow = () => {
    setShowDeleteWarn(false);
    setShowDeleteConfirm(false);
    setDeleting(false);
    setDeleteError("");
  };

  const performDelete = async () => {
    if (!selectedProduct) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await http.manageProducts("delete", {
        productID: selectedProduct.PRODUCT_ID,
      });

      const ok =
        (res && (res.success === true || res.status === true || res.deleted)) ??
        false;

      if (!ok) {
        throw new Error(res?.err || res?.status || "Delete failed");
      }

      await refreshProducts();
      setSelectedProduct(null);
      setShowProductList(false);
      setShowDeleteConfirm(false);
    } catch (e) {
      setDeleteError(String(e?.message || e));
    } finally {
      setDeleting(false);
    }
  };

  // Link to existing pool (then refresh pools and local product shape)
  const linkToExistingPool = async () => {
    if (!selectedProduct || !selectedPoolId) return;

    setPoolLoading(true);
    try {
      const payload = {
        poolID: selectedPoolId,
        productID: selectedProduct.PRODUCT_ID,
        normalizeRatio,
        process: "edit",
      };
      const res = await http.virtualPoolProductAdd(payload);

      if (res?.linkedProduct || res?.statusCode === 10) {
        await refreshPools();
        const updated = {
          ...selectedProduct,
          poolRef: { poolID: selectedPoolId, ratio: normalizeRatio },
        };
        setSelectedProduct(updated);
        setProductList((prev) =>
          prev.map((p) => (p.PRODUCT_ID === updated.PRODUCT_ID ? updated : p))
        );
      } else {
        console.error(res?.status || "Failed to link product to pool.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  // Create pool then link (best-effort to find created pool by name)
  const createPoolAndLink = async () => {
    if (!selectedProduct || !poolName.trim()) return;

    setPoolLoading(true);
    try {
      const created = await http.createVirtualPools({
        name: poolName.trim(),
        virtualStock: 0,
        productID: selectedProduct.PRODUCT_ID,
        normalizeRatio,
        process: "edit",
      });

      if (created?.createdTable) {
        await refreshPools();

        const pools = await http.getVirtualStockPools();
        const createdPool =
          (pools.arr || []).find((p) => p.name === poolName.trim()) || null;

        const newPoolId = created?.poolID || createdPool?.poolID || "";
        const updated = {
          ...selectedProduct,
          poolRef: { poolID: newPoolId, ratio: normalizeRatio },
        };
        setSelectedProduct(updated);
        setProductList((prev) =>
          prev.map((p) => (p.PRODUCT_ID === updated.PRODUCT_ID ? updated : p))
        );
        setSelectedPoolId(newPoolId);
        setCreatingPool(false);
        setPoolName("");
      } else {
        console.error(created?.status || "Failed to create & link pool.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  // Remove link (resolves pool id from state/tokens/pools)
  const removeLink = async () => {
    if (!selectedProduct) return;

    const currentPoolId = resolveEffectivePoolId({
      selectedPoolId,
      selectedProduct,
      findCurrentLink,
    });
    if (!currentPoolId) {
      console.warn("[removeLink] No poolID resolved; aborting.");
      return;
    }

    setPoolLoading(true);
    try {
      const payload = {
        poolID: currentPoolId,
        productID: selectedProduct.PRODUCT_ID,
        process: "edit",
      };
      const res = await http.virtualPoolProductRemove(payload);

      if (res?.unlinkedProduct) {
        await refreshPools();
        const updated = { ...selectedProduct };
        delete updated.poolRef;
        delete updated.POOL_REF;
        delete updated.currentPoolRef;
        delete updated.POOL_RATIO;

        setSelectedProduct(updated);
        setProductList((prev) =>
          prev.map((p) => (p.PRODUCT_ID === updated.PRODUCT_ID ? updated : p))
        );
      } else {
        console.error(res?.status || "Failed to remove pool link.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  // ===== UI helpers =====
  const renderField = (label, field, options = []) => {
    const isEdited =
      editedFields[field] !== undefined &&
      editedFields[field] !== selectedProduct[field];
    const isDropdown = options.length > 0;

    return (
      <div className="mb-4">
        <label className="block mb-2 text-black">{label}</label>
        <div className="relative">
          {isDropdown ? (
            <select
              value={editedFields[field] || selectedProduct[field] || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full p-2 border ${
                isEdited ? "border-green-500" : "border-gray-300"
              } rounded text-black`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {`${option.value} - ${option.label}`}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editedFields[field] || selectedProduct[field] || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full p-2 border ${
                isEdited ? "border-green-500" : "border-gray-300"
              } rounded text-black`}
            />
          )}
          {isEdited && (
            <span className="absolute right-2 top-2 text-green-500">
              Edited
            </span>
          )}
        </div>
      </div>
    );
  };

  // Compute pooled link + route-specific message (for banner above node graph)
  const currentLink =
    selectedProduct && findCurrentLink(selectedProduct.PRODUCT_ID);
  const isLinkedToPool = Boolean(currentLink?.poolID);
  const routeMsg =
    route === "activation"
      ? "You can activate items; Active stock will increase. Don’t manually update Stored — the pool will adjust linked products automatically."
      : "Use receipt flows (v2) for this route. Don’t manually update Stored — the pool will automatically handle it for linked products.";

  // checkbox state for BarcodeGeneration
  const barcodeChecked =
    editedFields.BarcodeGeneration !== undefined
      ? toBool(editedFields.BarcodeGeneration)
      : toBool(selectedProduct?.BarcodeGeneration);


  const [showGraphFullscreen, setShowGraphFullscreen] = useState(false);

  useEffect(() => {
   if (!showGraphFullscreen) return;
  const onEsc = (e) => {
     if (e.key === "Escape") setShowGraphFullscreen(false);
   };
   window.addEventListener("keydown", onEsc);
   return () => window.removeEventListener("keydown", onEsc);
  }, [showGraphFullscreen]);

  return (
    <div className="relative h-[62vh]">
      <button
        onClick={toggleProductList}
        className="w-full p-4 bg-blue-600/80 text-white rounded mb-2 text-lg font-semibold"
      >
        {selectedProduct
          ? `${selectedProduct.NAME} (press to select another product)`
          : "Select a Product"}
      </button>

      {showProductList && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleProductList}
          />
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-3xl">
              <div className="sticky top-0 bg-white z-10 p-4 flex items-center">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded text-black bg-gray-100"
                  />
                </div>
                <button
                  onClick={toggleProductList}
                  className="ml-4 bg-red-500 text-white p-2 rounded"
                >
                  Back
                </button>
              </div>

              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="w-full p-2 border-t border-b border-gray-300 mt-2 text-black bg-gray-100"
              >
                <option value="All">All Companies</option>
                {companies.map((company) => (
                  <option key={company.COMPANY_ID} value={company.COMPANY_ID}>
                    {company.NAME}
                  </option>
                ))}
              </select>

              <div
                ref={productListRef}
                className="h-[40vh] overflow-y-auto border-t border-gray-300"
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Company
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-700 text-white divide-y divide-gray-600">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={index}
                        ref={index === 0 ? rowRef : null}
                        onClick={() => handleProductClick(product)}
                        className={`cursor-pointer ${
                          selectedProduct === product
                            ? "bg-blue-600 text-white font-bold"
                            : index % 2 === 0
                            ? "bg-gray-600 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.NAME}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.PRODUCT_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.TYPE}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.COMPANY}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <div className="mt-4">
          {/* success toast */}
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
              Successfully changed objects
            </div>
          )}

          {/* ======== POOL LINK SECTION (Card if linked, Form if not) ======== */}
          <div className="mb-6">
            {(() => {
              const link = findCurrentLink(selectedProduct.PRODUCT_ID);

              if (link) {
                return (
                  <div className="bg-green-50 border border-green-700 rounded p-4 flex items-center justify-between">
                    <div>
                      <div className="text-black">
                        <strong>Linked pool:</strong> {link.poolName}
                      </div>
                      <div className="text-black">
                        <strong>Ratio:</strong>{" "}
                        {Number.isFinite(link.ratio) ? link.ratio : "—"}
                      </div>
                      <div className="text-black font-mono">
                        <strong>PRODUCT_ID:</strong> {link.productID}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeLink}
                      disabled={poolLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-60"
                    >
                      Remove Link
                    </button>
                  </div>
                );
              }

              // Not linked — show create/link form
              return (
                <div className="p-4 rounded border border-gray-300 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 text-black">
                      <input
                        type="checkbox"
                        checked={creatingPool}
                        onChange={(e) => setCreatingPool(e.target.checked)}
                      />
                      Create New Pool?
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {creatingPool ? (
                      <label className="flex-1 text-black">
                        Pool Name
                        <input
                          value={poolName}
                          onChange={(e) => setPoolName(e.target.value)}
                          placeholder="e.g., 12oz Bottles"
                          className="w-full p-2 mt-1 border border-gray-300 rounded text-black bg-white"
                        />
                      </label>
                    ) : (
                      <label className="flex-1 text-black">
                        Select Existing Pool
                        <select
                          value={selectedPoolId}
                          onChange={(e) => setSelectedPoolId(e.target.value)}
                          className="w-full p-2 mt-1 border border-gray-300 rounded text-black bg-white"
                        >
                          <option value="">--</option>
                          {virtualPools.map((p) => (
                            <option key={p.poolID} value={p.poolID}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label className="flex-1 text-black">
                      Normalize Ratio
                      <input
                        type="number"
                        step="0.0001"
                        value={normalizeRatio}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setNormalizeRatio(Number.isFinite(v) ? v : 1);
                        }}
                        className="w-full p-2 mt-1 border border-gray-300 rounded text-black bg-white"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={
                      creatingPool ? createPoolAndLink : linkToExistingPool
                    }
                    disabled={
                      poolLoading ||
                      (creatingPool ? !poolName.trim() : !selectedPoolId)
                    }
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-60"
                  >
                    {creatingPool ? "Create Pool & Link" : "Link to Pool"}
                  </button>
                </div>
              );
            })()}
          </div>
          {/* ======== END POOL LINK SECTION ======== */}

          {/* Core editable fields */}
          {renderField("Name", "NAME")}
          {renderField(
            "Type",
            "TYPE",
            productTypes.map((pt) => ({ value: pt.TYPE_ID, label: pt.TYPE }))
          )}
          {renderField(
            "Company",
            "COMPANY",
            companies.map((c) => ({ value: c.COMPANY_ID, label: c.NAME }))
          )}
          {renderField("Unit Type", "UNIT_TYPE", [
            { value: "UNIT", label: "UNIT" },
            { value: "BUNDLE", label: "BUNDLE" },
          ])}
          {renderField("Location", "LOCATION", [
            { value: "4322", label: "4322" },
          ])}

          {/* NEW: Needs Barcode For Shipment toggle */}
          <div className="mt-3 p-4 rounded border border-gray-300 bg-gray-50">
            <label className="flex items-center gap-3 text-black">
              <input
                type="checkbox"
                checked={barcodeChecked}
                onChange={(e) =>
                  handleFieldChange("BarcodeGeneration", e.target.checked)
                }
              />
              <span className="font-medium">Needs Barcode For Shipment</span>
            </label>
            <p className="text-sm text-gray-600 mt-1">
              When enabled, this product requires a generated barcode for
              inbound shipments.
            </p>
          </div>

          {/* Actions: Save + Delete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleCommitChanges}
              className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded text-md font-semibold shadow transition duration-150"
            >
              Save Edit Changes
            </button>

            <button
              onClick={handleDeleteClick}
              className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded text-md font-semibold shadow transition duration-150"
            >
              Delete Product
            </button>
          </div>

          {/* Node view */}
          <div className="mb-4 mt-6">
            <label className="block mb-2 text-black">Select Node View</label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black mb-4"
            >
              <option value="activation">Activation</option>
              <option value="reduction">Reduction</option>
              <option value="shipment">Shipment</option>
            </select>
            <button
              onClick={() => runtimeTestHandler(selectedProduct.PRODUCT_ID)}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-md font-semibold shadow transition duration-150"
            >
              Run Token Test
            </button>
                        <button
           onClick={() => setShowGraphFullscreen(true)}
           className="mt-3 w-full p-3 bg-slate-800 hover:bg-slate-900 text-white rounded text-md font-semibold shadow transition duration-150 border border-cyan-400/50"
          title="Open the node graph in fullscreen (Esc to exit)"
         >
         Expand Graph (Fullscreen)
+            </button>
          </div>

          {/* Guidance banner when product is linked to a pool */}
          {isLinkedToPool && (
            <div className="mb-3 p-4 rounded-lg border border-blue-400 bg-blue-50 text-blue-900">
              <div className="font-semibold">
                Heads up — this product is linked to a virtual pool
                {currentLink?.poolName ? (
                  <>
                    : <span className="font-bold">{currentLink.poolName}</span>
                  </>
                ) : (
                  ""
                )}
                .
              </div>
              <div className="mt-1">{routeMsg}</div>
              <ul className="list-disc ml-6 mt-2">
                <li>
                  Prefer <span className="font-semibold">receipt</span> nodes
                  (v2) for reductions/shipments.
                </li>
                <li>
                  For <span className="font-semibold">activation</span>, use
                  Activate nodes; skip manual{" "}
                  <span className="font-semibold">Stored</span> updates.
                </li>
                <li>
                  The pool keeps <span className="font-semibold">Stored</span>{" "}
                  in sync across linked products for you.
                </li>
              </ul>
            </div>
          )}

          <NodeRenderer
            selectedProduct={selectedProduct}
            route={route}
            products={productList}
            registry={registry}
            refTree={refTrees[route]}
            setRefTree={(updatedTree) =>
              setRefTrees((prev) => ({ ...prev, [route]: updatedTree }))
            }
            setSelectedProduct={setSelectedProduct}
          />

          <NodeFlowGuide
            isLinked={Boolean(
              selectedProduct &&
                (findCurrentLink(selectedProduct.PRODUCT_ID) ||
                  /(?:^|\s)VIRTUALOPS:4i57:[^:\s]+:[^:\s]+(?:\s|$)/i.test(
                    `${selectedProduct?.ACTIVATION_TOKEN || ""} ${
                      selectedProduct?.SHIPMENT_TOKEN || ""
                    }`
                  ))
            )}
            route={route}
            productName={selectedProduct?.NAME}
          />

          <div className="w-full p-4 text-white rounded text-lg font-semibold mt-8 mb-40" />
        </div>
      )}

      {/* ===== Delete Flow Modals ===== */}
      <Modal open={showDeleteWarn} onClose={cancelDeleteFlow}>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-black mb-2">Warning</h3>
          <p className="text-black mb-4">
            You are about to delete{" "}
            <span className="font-semibold">{selectedProduct?.NAME}</span> (
            <span className="font-mono">{selectedProduct?.PRODUCT_ID}</span>).
            This may also unlink any virtual stock pool references on the
            server.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelDeleteFlow}
              className="px-4 py-2 rounded border border-gray-300 text-black"
            >
              Cancel
            </button>
            <button
              onClick={proceedToFinalConfirm}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm} onClose={cancelDeleteFlow}>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-black mb-2">
            Final Confirmation
          </h3>
          <p className="text-black mb-4">
            Are you absolutely sure you want to delete{" "}
            <span className="font-semibold">{selectedProduct?.NAME}</span>? This
            action cannot be undone.
          </p>
          {deleteError && (
            <div className="mb-3 p-3 rounded bg-red-50 text-red-700 border border-red-200">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelDeleteFlow}
              disabled={deleting}
              className="px-4 py-2 rounded border border-gray-300 text-black disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={performDelete}
              disabled={deleting}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </div>
      </Modal>
      {/* ===== End Delete Flow Modals ===== */}
    </div>
  );
}
