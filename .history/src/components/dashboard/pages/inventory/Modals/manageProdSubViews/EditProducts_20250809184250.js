// EditProduct.jsx — tables kept for picker, single Pool Link card, ratio update = remove→add
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import NodeRenderer from "./node/NodeRenderer";
import http_handler from "../../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

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

  // === Virtual pools state ===
  const [virtualPools, setVirtualPools] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [normalizeRatio, setNormalizeRatio] = useState(1);

  // ===== Data load =====
  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, [props.api]);

  // ===== Helpers =====
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setEditedFields({
      TYPE: product.TYPE,
      COMPANY: product.COMPANY,
      NAME: product.NAME,
      UNIT_TYPE: product.UNIT_TYPE,
      LOCATION: product.LOCATION,
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
    const updates = Object.keys(editedFields).reduce((acc, key) => {
      if (editedFields[key] !== selectedProduct[key]) {
        acc.push({ field: key, value: editedFields[key] });
      }
      return acc;
    }, []);

    if (updates.length === 0) return;

    const payload = {
      PRODUCT_ID: selectedProduct.PRODUCT_ID,
      updates,
      section: "form",
    };
    const response = await props.api.commitChanges(payload);
    if (response?.status === true) {
      setProductList((prevList) =>
        prevList.map((product) =>
          product.PRODUCT_ID === selectedProduct.PRODUCT_ID
            ? { ...product, ...editedFields }
            : product
        )
      );
      setSelectedProduct((p) => ({ ...p, ...editedFields }));
      setSuccess(true);
    } else {
      console.error("Failed to update product");
    }
  };

  // ===== Pools: truth from LINKED_PRODUCTS =====
  const refreshPools = async () => {
    const pools = await http.getVirtualStockPools();
    setVirtualPools(pools.arr || []);
  };

  const findCurrentLink = useCallback(
    (productID) => {
      if (!productID || !virtualPools?.length) return null;
      for (const p of virtualPools) {
        const linked = Array.isArray(p.LINKED_PRODUCTS)
          ? p.LINKED_PRODUCTS
          : [];
        const hit = linked.find((lp) => lp?.productID === productID);
        if (hit) {
          return {
            poolID: p.poolID,
            poolName: p.name,
            ratio: Number(hit.ratio),
            productID: hit.productID,
          };
        }
      }
      return null;
    },
    [virtualPools]
  );

  // Keep normalizeRatio synced to the currently linked ratio (if any)
  useEffect(() => {
    if (!selectedProduct) return;
    const current = findCurrentLink(selectedProduct.PRODUCT_ID);
    if (current && Number.isFinite(current.ratio)) {
      setNormalizeRatio(current.ratio);
    }
  }, [selectedProduct, findCurrentLink]);

  // Link to existing pool
  const linkToExistingPool = async () => {
    if (!selectedProduct || !selectedPoolId) return;
    setPoolLoading(true);
    try {
      const res = await http.virtualPoolProductAdd({
        poolID: selectedPoolId,
        productID: selectedProduct.PRODUCT_ID,
        normalizeRatio,
      });
      if (res?.linkedProduct) {
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

  // Create + link
  const createPoolAndLink = async () => {
    if (!selectedProduct || !poolName.trim()) return;
    setPoolLoading(true);
    try {
      const created = await http.createVirtualPools({
        name: poolName.trim(),
        virtualStock: 0,
        productID: selectedProduct.PRODUCT_ID,
        normalizeRatio,
      });
      if (created?.createdTable) {
        await refreshPools();
        // Prefer API to return poolID; fallback find-by-name:
        const pools = await http.getVirtualStockPools();
        const createdPool =
          (pools.arr || []).find((p) => p.name === poolName.trim()) || null;
        const poolID = createdPool?.poolID || "";

        const updated = {
          ...selectedProduct,
          poolRef: { poolID, ratio: normalizeRatio },
        };
        setSelectedProduct(updated);
        setProductList((prev) =>
          prev.map((p) => (p.PRODUCT_ID === updated.PRODUCT_ID ? updated : p))
        );
        setSelectedPoolId(poolID);
        setPoolName("");
      } else {
        console.error(created?.status || "Failed to create & link pool.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  // Remove link (unlink only)
  const removeLink = async () => {
    if (!selectedProduct) return;
    const current = findCurrentLink(selectedProduct.PRODUCT_ID);
    if (!current) return;

    setPoolLoading(true);
    try {
      const res = await http.virtualPoolProductRemove({
        poolID: current.poolID,
        productID: selectedProduct.PRODUCT_ID,
      });
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
        console.error(res?.status || "Failed to remove link.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  // Update ratio = remove old link → add new link (same pool)
  const updateRatio = async (newRatio) => {
    if (!selectedProduct) return;
    const current = findCurrentLink(selectedProduct.PRODUCT_ID);
    if (!current) return;

    setPoolLoading(true);
    try {
      // 1) remove old link
      await http.virtualPoolProductRemove({
        poolID: current.poolID,
        productID: selectedProduct.PRODUCT_ID,
      });

      // 2) add new link with updated ratio
      const res = await http.virtualPoolProductAdd({
        poolID: current.poolID,
        productID: selectedProduct.PRODUCT_ID,
        normalizeRatio: newRatio,
      });

      if (res?.linkedProduct) {
        await refreshPools();
        const updated = {
          ...selectedProduct,
          poolRef: { poolID: current.poolID, ratio: newRatio },
        };
        setSelectedProduct(updated);
        setProductList((prev) =>
          prev.map((p) => (p.PRODUCT_ID === updated.PRODUCT_ID ? updated : p))
        );
        setNormalizeRatio(newRatio);
      } else {
        console.error("Failed to update ratio (relink).");
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
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
              Successfully changed objects
            </div>
          )}

          {/* ======= Pool Link Card ======= */}
          <div className="mb-6">
            {(() => {
              const current = selectedProduct
                ? findCurrentLink(selectedProduct.PRODUCT_ID)
                : null;

              if (current) {
                // Linked card
                return (
                  <div className="rounded border border-green-700 bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-green-900">
                        Linked to Pool
                      </h3>
                      {poolLoading && (
                        <span className="text-sm text-green-700">
                          Processing…
                        </span>
                      )}
                    </div>

                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-black">
                        <strong>Pool:</strong>{" "}
                        <span className="text-green-900">
                          {current.poolName}
                        </span>
                      </div>
                      <div className="text-black">
                        <strong>Pool ID:</strong>{" "}
                        <code className="text-green-800">{current.poolID}</code>
                      </div>
                      <div className="text-black">
                        <strong>Product ID:</strong>{" "}
                        <code className="text-green-800">
                          {current.productID}
                        </code>
                      </div>
                      <div className="text-black">
                        <strong>Current Ratio:</strong>{" "}
                        <code className="text-green-800">{current.ratio}</code>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block mb-1 text-black">
                          New Ratio
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={normalizeRatio}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setNormalizeRatio(
                              Number.isFinite(v) ? v : current.ratio
                            );
                          }}
                          className="w-full p-2 border border-green-300 rounded text-black bg-white"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => updateRatio(normalizeRatio)}
                          disabled={
                            poolLoading || normalizeRatio === current.ratio
                          }
                          className="w-full md:w-auto px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded disabled:opacity-60"
                        >
                          Update Ratio (remove → add)
                        </button>
                        <button
                          onClick={removeLink}
                          disabled={poolLoading}
                          className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-60"
                        >
                          Remove Link
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Not linked: minimal link/create controls
              return (
                <div className="rounded border border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-black">Pool Link</h3>
                    {poolLoading && (
                      <span className="text-sm text-gray-600">Processing…</span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block mb-1 text-black">Ratio</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={normalizeRatio}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setNormalizeRatio(Number.isFinite(v) ? v : 1);
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-black">
                        Existing Pool
                      </label>
                      <select
                        value={selectedPoolId}
                        onChange={(e) => setSelectedPoolId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                      >
                        <option value="">--</option>
                        {virtualPools.map((p) => (
                          <option key={p.poolID} value={p.poolID}>
                            {p.name} ({p.poolID})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={linkToExistingPool}
                        disabled={
                          !selectedPoolId || poolLoading || !selectedProduct
                        }
                        className="mt-2 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-60"
                      >
                        Link to Selected
                      </button>
                    </div>

                    <div>
                      <label className="block mb-1 text-black">
                        Create Pool
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={poolName}
                          onChange={(e) => setPoolName(e.target.value)}
                          placeholder="e.g., 12oz Bottles"
                          className="flex-1 p-2 border border-gray-300 rounded text-black bg-white"
                        />
                        <button
                          onClick={createPoolAndLink}
                          disabled={
                            !poolName.trim() || poolLoading || !selectedProduct
                          }
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-60"
                        >
                          Create & Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          {/* ======= /Pool Link Card ======= */}

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

          {/* Save Edit Changes button */}
          <button
            onClick={handleCommitChanges}
            className="w-full mb-4 p-3 bg-green-600 hover:bg-green-700 text-white rounded text-md font-semibold shadow transition duration-150"
          >
            Save Edit Changes
          </button>

          {/* Node view */}
          <div className="mb-4">
            <label className="block mb-2 text-black">Select Node View</label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            >
              <option value="activation">Activation</option>
              <option value="reduction">Reduction</option>
              <option value="shipment">Shipment</option>
            </select>
          </div>

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

          <div className="w-full p-4 text-white rounded text-lg font-semibold mt-8 mb-40" />
        </div>
      )}
    </div>
  );
}
