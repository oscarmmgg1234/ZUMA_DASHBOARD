// EditProduct.jsx — card when linked (shows pool name), form when not linked.
// Robust to LINKED_PRODUCTS being a stringified JSON array.
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

  // ==== Virtual pools state ====
  const [virtualPools, setVirtualPools] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [creatingPool, setCreatingPool] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [normalizeRatio, setNormalizeRatio] = useState(1);

  // --- baseline tracking for virtualops ---
  const baselineVirtualOpsRef = useRef(null);
  const lastProductIdRef = useRef(null);

  const serializeVO = (vo) => (vo ? `${vo.productID}|${vo.poolID}` : "null");

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

  const getCurrentPoolId = (p) =>
    p?.poolRef?.poolID ??
    p?.poolRef ??
    p?.POOL_REF ??
    p?.currentPoolRef ??
    null;

  const findCurrentLink = useCallback(
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

  const computeVirtualOps = useCallback(
    (product) => {
      if (!product) return null;
      const link = findCurrentLink(product.PRODUCT_ID);
      if (link?.poolID) {
        return { productID: product.PRODUCT_ID, poolID: String(link.poolID) };
      }
      const fallbackPoolID = getCurrentPoolId(product);
      if (fallbackPoolID) {
        return {
          productID: product.PRODUCT_ID,
          poolID: String(fallbackPoolID),
        };
      }
      return null;
    },
    [findCurrentLink]
  );

  useEffect(() => {
    if (!selectedProduct) {
      baselineVirtualOpsRef.current = null;
      lastProductIdRef.current = null;
      return;
    }
    const pid = selectedProduct.PRODUCT_ID;
    if (pid !== lastProductIdRef.current) {
      const vo = computeVirtualOps(selectedProduct);
      baselineVirtualOpsRef.current = serializeVO(vo);
      lastProductIdRef.current = pid;
    }
  }, [selectedProduct, computeVirtualOps]);

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

  // Refresh pools when changing selected product
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

  // ======== FIXED SAVE =========
  const handleCommitChanges = async () => {
    const updates = Object.keys(editedFields).reduce((acc, key) => {
      if (editedFields[key] !== selectedProduct[key]) {
        acc.push({ field: key, value: editedFields[key] });
      }
      return acc;
    }, []);

    const virtualops = computeVirtualOps(selectedProduct);
    const currentVO = serializeVO(virtualops);
    const baselineVO = baselineVirtualOpsRef.current;
    const virtualChanged = currentVO !== baselineVO;

    if (virtualChanged) {
      updates.push({
        field: "POOL_REF", // adjust if backend expects another field
        value: virtualops ? virtualops.poolID : null,
      });
    }

    if (updates.length === 0) return;

    const payload = {
      PRODUCT_ID: selectedProduct.PRODUCT_ID,
      updates,
      section: virtualChanged && updates.length === 1 ? "virtualops" : "form",
      virtualops,
    };

    const response = await props.api.commitChanges(payload);
    if (response?.status === true) {
      const patch = updates.reduce((m, u) => {
        m[u.field] = u.value;
        return m;
      }, {});

      setProductList((prevList) =>
        prevList.map((p) =>
          p.PRODUCT_ID === selectedProduct.PRODUCT_ID ? { ...p, ...patch } : p
        )
      );
      setSelectedProduct((p) => ({ ...p, ...patch }));

      baselineVirtualOpsRef.current = currentVO;
      setSuccess(true);
    } else {
      console.error("Failed to update product");
    }
  };
  // ==============================

  // Keep ratio synced to link
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
        setCreatingPool(false);
        setPoolName("");
      } else {
        console.error(created?.status || "Failed to create & link pool.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

  const removeLink = async () => {
    if (!selectedProduct) return;
    const current = findCurrentLink(selectedProduct.PRODUCT_ID);
    const currentPoolId = current?.poolID ?? getCurrentPoolId(selectedProduct);
    if (!currentPoolId) return;
    setPoolLoading(true);
    try {
      const res = await http.virtualPoolProductRemove({
        poolID: currentPoolId,
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
        console.error(res?.status || "Failed to remove pool link.");
      }
    } finally {
      setPoolLoading(false);
    }
  };

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

      {/* ...rest of your JSX for list, pool link card/form, fields, save button, node renderer... */}
    </div>
  );
}
