/*
 
 Author: Oscar Maldonado
 Email: oscarmmgg1234@gmail.com

 Creation Date: 2025-08-15 12:12:03

 Virtual Stock Manager UI — single-file, drop-in component
*/
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

// --------------------------- API ADAPTERS ---------------------------
const getProducts = async () => {
  // expects { error: boolean, data: [...] }
  const products = await http.getProducts();
  return products?.data || [];
};

const getPools = async () => {
  const pools = await http.getVirtualStockPools();
  return pools?.arr || [];
};

const createVirtualPoolHandler = async (data) => {
  return await http.api_createVirtualPool(data);
};

const removeVirtualPoolHandler = async (data) => {
  return await http.api_removeVirtualPool(data);
};

const updateVirtualStockHandler = async (data) => {
  return await http.api_updateVirtualStock(data);
};

const updateVirtualPoolNameHandler = async (data) => {
  return await http.api_updateVirtualPoolName(data);
};

const updateLinkedProductsHandler = async (data) => {
  return await http.api_updateVirtualLinkedProducts(data);
};

// --------------------------- UI HELPERS ---------------------------
const Spinner = () => (
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
);

const Overlay = ({ show, label }) =>
  show ? (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-lg">
        <Spinner />
        <span className="text-sm font-medium text-gray-700">
          {label || "Processing..."}
        </span>
      </div>
    </div>
  ) : null;

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
    {children}
  </h3>
);

const Field = ({ label, children }) => (
  <label className="flex w-full flex-col gap-1 text-sm">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    {children}
  </label>
);

const Button = ({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98]";
  const styles = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50",
    subtle: "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

// --------------------------- MAIN COMPONENT ---------------------------
export default function VirtualStockManagement(props) {
  const { visible, closeHandler } = props;

  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    poolName: "",
    initStock: "",
    poolID: "",
  });

  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, prods] = await Promise.all([getPools(), getProducts()]);
      setPools(Array.isArray(list) ? list : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (e) {
      setError(e?.message || "Failed to fetch pools/products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      refresh();
      mountedRef.current = true;
    }
  }, [visible, refresh]);

  const onCreate = async (e) => {
    e?.preventDefault?.();
    const payload = {
      poolID:
        createForm.poolID?.trim() ||
        (crypto?.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      poolName: createForm.poolName?.trim(),
      initStock: Number(createForm.initStock || 0),
    };
    if (!payload.poolName) return setError("Pool name is required");
    setCreating(true);
    try {
      const res = await createVirtualPoolHandler(payload);
      if (!res?.success) throw new Error(res?.message || "Create failed");
      setCreateForm({ poolName: "", initStock: "", poolID: "" });
      await refresh();
    } catch (e) {
      setError(e?.message || "Failed to create pool");
    } finally {
      setCreating(false);
    }
  };

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"Manage Virtual Stock"}
      closeName={"virtualManager"}
    >
      <div className="relative text-black ">
        <Overlay show={loading} label="Loading pools..." />
        <div className="flex flex-col gap-6">
          {/* Create */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle >Create a Pool</SectionTitle>
            </div>
            <form
              onSubmit={onCreate}
              className="grid grid-cols-1 gap-3 md:grid-cols-4"
            >
              <Field label="Pool Name">
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="e.g. Probiotic Pool"
                  value={createForm.poolName}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, poolName: e.target.value }))
                  }
                />
              </Field>
              <Field label="Initial Stock">
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="0"
                  value={createForm.initStock}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, initStock: e.target.value }))
                  }
                />
              </Field>
              <Field label="Pool ID (optional)">
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="auto-generated if empty"
                  value={createForm.poolID}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, poolID: e.target.value }))
                  }
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Spinner /> Creating
                    </>
                  ) : (
                    "Create Pool"
                  )}
                </Button>
              </div>
            </form>
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            <SectionTitle>Existing Pools</SectionTitle>
            {pools?.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No pools yet. Create one above to get started.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {pools.map((p) => (
                  <li key={p.poolID}>
                    <PoolRow
                      pool={p}
                      onChanged={refresh}
                      allProducts={products}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// --------------------------- ROW COMPONENT ---------------------------
function PoolRow({ pool, onChanged, allProducts = [] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(pool?.name || "");
  const [stock, setStock] = useState(String(pool?.VIRTUAL_STOCK ?? ""));

  // LINKED_PRODUCTS may come as JSON string or array
  const parsedLinked = useMemo(() => {
    try {
      if (Array.isArray(pool?.LINKED_PRODUCTS)) return pool.LINKED_PRODUCTS;
      if (!pool?.LINKED_PRODUCTS) return [];
      const val = JSON.parse(pool.LINKED_PRODUCTS);
      return Array.isArray(val) ? val : [];
    } catch {
      return [];
    }
  }, [pool]);

  const [links, setLinks] = useState(parsedLinked);

  useEffect(() => {
    setLinks(parsedLinked);
  }, [parsedLinked]);

  const saveName = async () => {
    setBusy(true);
    try {
      const res = await updateVirtualPoolNameHandler({
        poolID: pool.poolID,
        newName: name?.trim(),
      });
      if (!res?.success) throw new Error(res?.message || "Rename failed");
      await onChanged?.();
    } catch (e) {
      alert(e?.message || "Failed to update name");
    } finally {
      setBusy(false);
    }
  };

  const saveStock = async () => {
    setBusy(true);
    try {
      const value = Number(stock);
      if (Number.isNaN(value)) throw new Error("Stock must be a number");
      const res = await updateVirtualStockHandler({
        poolID: pool.poolID,
        newStock: value,
      });
      if (!res?.success) throw new Error(res?.message || "Stock update failed");
      await onChanged?.();
    } catch (e) {
      alert(e?.message || "Failed to update stock");
    } finally {
      setBusy(false);
    }
  };

  const removePool = async () => {
    if (!confirm(`Remove pool "${pool?.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await removeVirtualPoolHandler({ poolID: pool.poolID });
      if (!res?.success) throw new Error(res?.message || "Remove failed");
      await onChanged?.();
    } catch (e) {
      alert(e?.message || "Failed to remove pool");
    } finally {
      setBusy(false);
    }
  };

  const addLink = async ({ productID, normalizeRatio }) => {
    setBusy(true);
    try {
      const res = await updateLinkedProductsHandler({
        poolID: pool.poolID,
        productID: productID.trim(),
        normalizeRatio: Number(normalizeRatio || 1),
        process: "addLinkedProduct",
      });
      if (!res?.success) throw new Error(res?.message || "Add link failed");
      await onChanged?.();
    } catch (e) {
      alert(e?.message || "Failed to add linked product");
    } finally {
      setBusy(false);
    }
  };

  const removeLink = async (productID) => {
    if (!confirm(`Unlink product ${productID}?`)) return;
    setBusy(true);
    try {
      const res = await updateLinkedProductsHandler({
        poolID: pool.poolID,
        productID,
        process: "removeLinkedProduct",
      });
      if (!res?.success) throw new Error(res?.message || "Remove link failed");
      await onChanged?.();
    } catch (e) {
      alert(e?.message || "Failed to remove linked product");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <Overlay show={busy} label="Updating..." />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 bg=">
          <button
            onClick={() => setOpen((s) => !s)}
            className="grid h-8 w-8 place-items-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
            title={open ? "Collapse" : "Expand"}
          >
            {open ? "–" : "+"}
          </button>
          <div>
            <div className="text-base font-semibold text-gray-900">
              {pool?.name}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-mono">{pool?.poolID}</span> • Linked:{" "}
              {links?.length || 0}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="danger" onClick={removePool}>
            Delete
          </Button>
          <Button variant="subtle" onClick={() => setOpen((s) => !s)}>
            {open ? "Hide" : "Manage"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Edit Name */}
          <div className="rounded-xl border border-gray-200 p-3">
            <SectionTitle>Rename</SectionTitle>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={saveName}>Save</Button>
            </div>
          </div>

          {/* Edit Stock */}
          <div className="rounded-xl border border-gray-200 p-3">
            <SectionTitle>Virtual Stock</SectionTitle>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
              <Button onClick={saveStock}>Save</Button>
            </div>
          </div>

          {/* Linked Products */}
          <div className="rounded-xl border border-gray-200 p-3 md:col-span-3">
            <SectionTitle>Linked Products</SectionTitle>
            <LinkEditor
              links={links}
              allProducts={allProducts}
              onAdd={addLink}
              onRemove={removeLink}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LinkEditor({ links, onAdd, onRemove, allProducts = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { PRODUCT_ID, NAME }
  const [ratio, setRatio] = useState("1");

  const inputRef = useRef(null);
  const anchorRef = useRef(null);   // wraps the input; used to compute dropdown position
  const popRef = useRef(null);

  // --- Map PRODUCT_ID -> NAME for fast lookup ---
  const nameById = useMemo(() => {
    const map = new Map();
    for (const p of allProducts) {
      const id = String(p.PRODUCT_ID ?? "");
      if (id) map.set(id, p.NAME || "Unnamed");
    }
    return map;
  }, [allProducts]);

  // --- Filter products by ID or NAME ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts.slice(0, 20);
    return allProducts
      .filter((p) => {
        const id = String(p.PRODUCT_ID || "").toLowerCase();
        const name = String(p.NAME || "").toLowerCase();
        return id.includes(q) || name.includes(q);
      })
      .slice(0, 50);
  }, [allProducts, query]);

  // ---- Positioning state for the portal popover ----
  const [popStyle, setPopStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 320,
    openUp: false,
  });

  const computePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    const desired = 320; // px
    const gap = 6;       // px between input and list
    const spaceBelow = viewportH - (rect.top + rect.height) - 8;
    const spaceAbove = rect.top - 8;

    const canOpenDown = spaceBelow >= 120; // heuristic
    const openUp = !canOpenDown && spaceAbove > spaceBelow;

    const maxHeight = Math.min(desired, openUp ? spaceAbove - gap : spaceBelow - gap);

    setPopStyle({
      top: openUp ? rect.top - maxHeight - gap : rect.top + rect.height + gap,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(160, maxHeight), // keep at least 160px visible
      openUp,
    });
  }, []);

  // Recompute on open, scroll, resize
  useEffect(() => {
    if (!open) return;

    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize, true);

    // Use a tiny rAF to get accurate layout after paint
    const raf = requestAnimationFrame(computePosition);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize, true);
      cancelAnimationFrame(raf);
    };
  }, [open, computePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e) => {
      const a = anchorRef.current;
      const p = popRef.current;
      if (a?.contains(e.target) || p?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  // Keyboard handling
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Blur handling: defer so list-item click can run first
  const onBlur = () => setTimeout(() => setOpen(false), 0);

  const pick = (p) => {
    setSelected({ PRODUCT_ID: p.PRODUCT_ID, NAME: p.NAME });
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  // --- Render ---
  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex flex-col items-stretch gap-2">
        <div className="relative">
          <div className="flex items-center gap-2">
            {/* Anchor: used for positioning */}
            <div className="relative w-full" ref={anchorRef}>
              <input
                ref={inputRef}
                onFocus={() => {
                  setOpen(true);
                  // slight delay so computePosition sees final layout
                  setTimeout(computePosition, 0);
                }}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder={
                  selected
                    ? `${selected.NAME} (${selected.PRODUCT_ID})`
                    : "Search product by name or ID"
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!open) setOpen(true);
                }}
              />
            </div>

            <input
              type="number"
              step="0.0001"
              placeholder="Ratio"
              className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
            />
            <Button
              onClick={() => {
                const productID = selected?.PRODUCT_ID;
                if (!productID) return alert("Select a product first");
                onAdd?.({ productID, normalizeRatio: ratio });
                setSelected(null);
                setRatio("1");
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              + Add Link
            </Button>
          </div>
        </div>
      </div>

      {/* Results popover via portal (escapes overflow clipping) */}
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "fixed",
              top: `${popStyle.top}px`,
              left: `${popStyle.left}px`,
              width: `${popStyle.width}px`,
              maxHeight: `${popStyle.maxHeight}px`,
              zIndex: 1000,
            }}
            className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
            // Prevent input blur from closing before click runs
            onMouseDown={(e) => e.preventDefault()}
          >
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No matches</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <li
                    key={p.PRODUCT_ID}
                    className="cursor-pointer px-3 py-2 hover:bg-gray-50"
                    onClick={() => pick(p)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {p.NAME || "Unnamed"}
                        </div>
                        <div className="truncate font-mono text-[11px] text-gray-500">
                          {p.PRODUCT_ID}
                        </div>
                      </div>
                      {p.UNIT_TYPE && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                          {p.UNIT_TYPE}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}

      {/* Linked products table (unchanged) */}
      {!links || links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          No linked products.
        </div>
      ) : (
        <div className="max-h-56 overflow-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Normalize Ratio</th>
                <th className="px-3 py-2">Meta</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, idx) => {
                const id = String(l.productID ?? "");
                const displayName = nameById.get(id) || "Unnamed";
                return (
                  <tr key={`${id}-${idx}`} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{displayName}</span>
                        {/* Uncomment if you want to also show ID */}
                        {/* <span className="font-mono text-[11px] text-gray-500">{id}</span> */}
                      </div>
                    </td>
                    <td className="px-3 py-2">{String(l.normalizeRatio ?? 1)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {Array.isArray(l.meta_data) && l.meta_data.length > 0
                        ? `${l.meta_data.length} entries`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" onClick={() => onRemove?.(id)}>
                        Unlink
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
