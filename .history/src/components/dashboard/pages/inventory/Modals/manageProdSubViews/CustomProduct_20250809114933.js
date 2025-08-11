import React, { useState, useEffect } from "react";
import http_handler from "../../HTTP/HTTPS_INTERFACE";
const http = new http_handler();
const headerTextColor = "black";
const inputTextColor = "black";
// 8-char ID
function generateShortUUID() {
  // crypto path first when available, fallback otherwise
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(4); // 4 bytes -> 8 hex chars
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function CustomProduct(props) {
  // ===== Core IDs / phase =====
  const [productID, setProductID] = useState(generateShortUUID());
  const [phase, setPhase] = useState("pool-setup"); // 'pool-setup' | 'form' | 'creating'
  const [isLoading, setIsLoading] = useState(false);

  // ===== Notifications =====
  const [notification, setNotification] = useState({
    message: "",
    visible: false,
  });
  const toast = (msg) => {
    setNotification({ message: msg, visible: true });
    setTimeout(() => setNotification({ message: "", visible: false }), 2500);
  };

  // ===== Reference data =====
  const [companies, setCompanies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [virtualPools, setVirtualPools] = useState([]);

  // ===== Pool UI state =====
  const [usePool, setUsePool] = useState(true);
  const [creatingPool, setCreatingPool] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [normalizeRatio, setNormalizeRatio] = useState(1);

  // Tracks current link status when linked
  // { linked: true, poolID, poolName, ratio, productID }
  const [linkStatus, setLinkStatus] = useState(null);

  // ===== Product form =====
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
    company: "",
    unitType: "", // you can replace with UNIT/BUNDLE dropdown if you have it
  });
  const [createLabel, setCreateLabel] = useState(false);
  const [needBarcode, setNeedBarcode] = useState(false);

  // --- helpers: required fields & packet compiler
  const requiredFields = ["name", "price", "type", "company", "unitType"];

  function buildProductPacket() {
    // basic required checks
    for (const f of requiredFields) {
      const v = (formFields[f] ?? "").toString().trim();
      if (!v) {
        throw new Error(`Missing required field: ${f}`);
      }
    }
    // price sanity
    const priceNum = Number(formFields.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      throw new Error("Price must be a non-negative number");
    }

    // pool rules
    const currentPoolRef =
      usePool && linkStatus?.linked ? linkStatus.poolID : null;

    // compile final packet (what your backend expects)
    const packet = {
      PRODUCT_ID: productID, // 8-char ID we’ve been using
      name: formFields.name.trim(),
      description: (formFields.description ?? "").trim(),
      price: priceNum,
      type: formFields.type,
      company: formFields.company,
      unitType: formFields.unitType, // "UNIT" | "BUNDLE"
      createLabel,
      needBarcode,
      currentPoolRef, // null or poolID
      // Optional: include extra context if helpful for backend logs
      _meta: {
        normalizeRatio: linkStatus?.linked ? linkStatus.ratio : normalizeRatio,
        linked: !!linkStatus?.linked,
        phase,
      },
    };

    return packet;
  }

  const handleCreateProduct = async () => {
    // Guard: if using pool, ensure we’re linked first
    if (usePool && !linkStatus?.linked) {
      return toast("Link the product to a pool first, or disable pool usage.");
    }

    try {
      const packet = buildProductPacket();
      console.log("[createProduct packet]", packet);

      await http.addProductProcess(packet);

      toast("Compiled product packet logged to console.");

      // === CLEAR EVERYTHING ===
      setProductID(generateShortUUID());
      setFormFields({
        name: "",
        description: "",
        price: "",
        type: "",
        company: "",
        unitType: "",
      });
      setCreateLabel(false);
      setNeedBarcode(false);
      setUsePool(true); // default state if you want
      setCreatingPool(false);
      setPoolName("");
      setSelectedPoolId("");
      setNormalizeRatio(1);
      setLinkStatus(null);
      setPhase("pool-setup"); // return to pool linking step
    } catch (err) {
      console.error("Packet build failed:", err);
      toast(err.message || "Invalid form data.");
    }
  };

  // below other state
  const canRegenerateID = !usePool || !linkStatus?.linked;

  const safeRegenerate = () => {
    if (!canRegenerateID) {
      toast("Unlink from pool to change PRODUCT_ID.");
      return;
    }
    setProductID(generateShortUUID());
  };

  // ===== Load selects + pools =====
  useEffect(() => {
    (async () => {
      try {
        const [comp, types, pools] = await Promise.all([
          props.api.getPartnerCompanies(),
          props.api.getProductTypes(),
          http.getVirtualStockPools(),
        ]);
        setCompanies(comp.data || []);
        setProductTypes(types.data || []);
        setVirtualPools(pools.arr || []);
      } catch (err) {
        console.error("Failed to fetch:", err);
        toast("Failed to load data.");
      }
    })();
  }, [props.api]);

  // ===== Helpers =====
  const propChange = (e) =>
    setFormFields((s) => ({ ...s, [e.target.name]: e.target.value }));
  const isFilled = (f) => (formFields[f] ?? "").toString().trim() !== "";

  // ===== Pool handlers (PRE-CREATION) =====
  const handleLinkPool = async () => {
    if (!usePool) {
      setLinkStatus(null);
      setPhase("form");
      return;
    }

    // Validate inputs
    if (creatingPool) {
      if (!poolName.trim()) return toast("Enter a pool name.");
    } else {
      if (!selectedPoolId) return toast("Select a pool to link.");
    }

    try {
      setIsLoading(true);

      if (creatingPool) {
        // Create new pool and immediately link this productID in linked list
        const res = await http.createVirtualPools({
          name: poolName.trim(),
          virtualStock: 0,
          productID, // pre-product creation link
          normalizeRatio,
        });
        if (res?.createdTable) {
          // Re-load pools to get new poolID + name in dropdowns
          const pools = await http.getVirtualStockPools();
          setVirtualPools(pools.arr || []);
          const created = (pools.arr || []).find(
            (p) => p.name === poolName.trim()
          );
          setLinkStatus({
            linked: true,
            poolID: created?.poolID,
            poolName: created?.name || poolName.trim(),
            ratio: normalizeRatio,
            productID,
          });
          toast("Pool created & product linked.");
          setPhase("form");
        } else {
          toast(res?.status || "Failed to create pool.");
        }
      } else {
        // Link to existing pool
        const res = await http.virtualPoolProductAdd({
          poolID: selectedPoolId,
          productID,
          normalizeRatio,
        });
        if (res?.linkedProduct) {
          const pool = virtualPools.find((p) => p.poolID === selectedPoolId);
          setLinkStatus({
            linked: true,
            poolID: selectedPoolId,
            poolName: pool?.name || "",
            ratio: normalizeRatio,
            productID,
          });
          toast("Product linked to pool.");
          setPhase("form");
        } else {
          // Show backend statuses (e.g., already linked)
          toast(res?.status || "Failed to link product.");
        }
      }
    } catch (err) {
      console.error(err);
      toast("Error linking to pool.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLink = async () => {
    if (!linkStatus?.linked) return;

    try {
      setIsLoading(true);
      const res = await http.virtualPoolProductRemove({
        poolID: linkStatus.poolID,
        productID: linkStatus.productID,
      });
      if (res?.unlinkedProduct) {
        setLinkStatus(null);
        toast("Link removed.");
        setPhase("pool-setup");
      } else {
        toast(res?.status || "Failed to remove link.");
      }
    } catch (err) {
      console.error(err);
      toast("Error removing link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {isLoading && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            {phase === "creating" ? "Creating product..." : "Processing..."}
          </div>
        </div>
      )}
      {notification.visible && (
        <div style={styles.toast}>{notification.message}</div>
      )}

      {/* ===== Product ID / header ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ fontFamily: "monospace" }}>
          <strong>PRODUCT_ID:</strong> {productID}
          {linkStatus?.linked && (
            <span
              style={{
                marginLeft: 8,
                padding: "2px 8px",
                fontSize: 12,
                borderRadius: 12,
                background: "#ffe0b2",
                border: "1px solid #ffb74d",
              }}
            >
              locked (linked to {linkStatus.poolName || "pool"})
            </span>
          )}
        </div>

        {canRegenerateID ? (
          <button
            type="button"
            onClick={safeRegenerate}
            style={styles.secondaryBtn}
            title="Regenerate 8-char ID"
          >
            Regenerate ID
          </button>
        ) : null}
      </div>

      {/* ===== STEP 1: Pool Setup (before product creation) ===== */}
      <div style={styles.sectionCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="checkbox"
            checked={usePool}
            onChange={(e) => {
              setUsePool(e.target.checked);
              if (!e.target.checked) {
                setLinkStatus(null);
                setPhase("form"); // skip to form if not using pool
              } else {
                setPhase("pool-setup");
              }
            }}
          />
          <strong>Link to Virtual Stock Pool</strong>
        </div>

        {usePool && !linkStatus?.linked && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={creatingPool}
                  onChange={(e) => setCreatingPool(e.target.checked)}
                />
                Create New Pool?
              </label>

              {creatingPool ? (
                <>
                  <label style={styles.field}>
                    Pool Name
                    <input
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      style={styles.input(!!poolName)}
                      placeholder="e.g., 12oz Bottles"
                    />
                  </label>
                </>
              ) : (
                <label style={styles.field}>
                  Select Existing Pool
                  <select
                    value={selectedPoolId}
                    onChange={(e) => setSelectedPoolId(e.target.value)}
                    style={styles.input(!!selectedPoolId)}
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

              <label style={styles.field}>
                Normalize Ratio
                <input
                  type="number"
                  step="0.0001"
                  value={normalizeRatio}
                  onChange={(e) =>
                    setNormalizeRatio(parseFloat(e.target.value) || 1)
                  }
                  style={styles.input(true)}
                />
              </label>

              <button
                type="button"
                onClick={handleLinkPool}
                style={styles.primaryBtn}
              >
                {creatingPool ? "Create Pool & Link" : "Link to Pool"}
              </button>
            </div>
            <p style={{ marginTop: 8, color: "#666" }}>
              This links <code>{productID}</code> to the chosen pool{" "}
              <em>before</em> creating the product record.
            </p>
          </div>
        )}

        {usePool && linkStatus?.linked && (
          <div style={styles.linkedCard}>
            <div>
              <div>
                <strong>Linked pool:</strong> {linkStatus.poolName}
              </div>
              <div>
                <strong>Ratio:</strong> {linkStatus.ratio}
              </div>
              <div style={{ fontFamily: "monospace" }}>
                <strong>PRODUCT_ID:</strong> {linkStatus.productID}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveLink}
              style={styles.unlinkButton}
            >
              Remove Link
            </button>
          </div>
        )}
      </div>

      {/* ===== STEP 2: Product Form (enabled once linked or pool disabled) ===== */}
      <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div
          style={{
            opacity: usePool && !linkStatus?.linked ? 0.5 : 1,
            pointerEvents: usePool && !linkStatus?.linked ? "none" : "auto",
          }}
        >
          <div style={styles.row}>
            {["name", "description", "price"].map((f) => (
              <div key={f} style={styles.field}>
                <label style={styles.label}>{f.toUpperCase()}</label>
                <input
                  name={f}
                  value={formFields[f]}
                  onChange={propChange}
                  style={styles.input(isFilled(f))}
                  placeholder={f === "price" ? "e.g., 12.99" : ""}
                />
              </div>
            ))}

            {/* TYPE */}
            <div style={styles.field}>
              <label style={styles.label}>TYPE</label>
              <select
                name="type"
                value={formFields.type}
                onChange={propChange}
                style={styles.input(isFilled("type"))}
              >
                <option value="">Select type</option>
                {productTypes.map((t) => (
                  <option key={t.TYPE_ID} value={t.TYPE_ID}>
                    {t.TYPE}
                  </option>
                ))}
              </select>
            </div>

            {/* COMPANY */}
            <div style={styles.field}>
              <label style={styles.label}>COMPANY</label>
              <select
                name="company"
                value={formFields.company}
                onChange={propChange}
                style={styles.input(isFilled("company"))}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.COMPANY_ID} value={c.COMPANY_ID}>
                    {c.NAME}
                  </option>
                ))}
              </select>
            </div>

            {/* UNIT TYPE (UNIT/BUNDLE) */}
            <div style={styles.field}>
              <label style={styles.label}>UNIT TYPE</label>
              <select
                name="unitType"
                value={formFields.unitType}
                onChange={propChange}
                style={styles.input(isFilled("unitType"))}
              >
                <option value="">Select</option>
                <option value="UNIT">UNIT</option>
                <option value="BUNDLE">BUNDLE</option>
              </select>
            </div>
          </div>

          <div style={styles.checkRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={createLabel}
                onChange={(e) => setCreateLabel(e.target.checked)}
              />
              Create Label
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={needBarcode}
                onChange={(e) => setNeedBarcode(e.target.checked)}
              />
              Need Barcode
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateProduct}
            style={styles.submit}
          >
            Create Product
          </button>
        </div>
        <p style={{ marginTop: 8, color: "#666" }}>
          Pool ref:{" "}
          <code>
            {usePool && linkStatus?.linked ? linkStatus.poolID : "null"}
          </code>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "920px",
    margin: "auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  sectionCard: {
    border: "1px solid #ddd",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    background: "#fafafa",
    color: headerTextColor,
  },
  row: { display: "flex", flexWrap: "wrap", gap: 20, color: headerTextColor },
  field: {
    flex: "1 1 220px",
    display: "flex",
    flexDirection: "column",
    marginBottom: 12,
    color: inputTextColor,
  },
  label: { marginBottom: 4, fontWeight: 600, fontSize: 12, color: headerTextColor },
  input: (filled) => ({
    padding: "10px",
    border: filled ? "2px solid #43a047" : "1px solid #aaa",
    borderRadius: 6,
    fontSize: 14,
    background: "#fff",
    color: inputTextColor
  }),
  form: { marginTop: 8 },
  checkRow: { display: "flex", gap: 30, margin: "12px 0" },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
  },
  linkedCard: {
    backgroundColor: "#e8f5e9",
    border: "1px solid #2e7d32",
    padding: 16,
    borderRadius: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  unlinkButton: {
    padding: "8px 16px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  primaryBtn: {
    padding: "10px 16px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "8px 12px",
    backgroundColor: "#eee",
    color: "#333",
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer",
  },
  submit: {
    padding: "12px 28px",
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 12,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "24px 40px",
    borderRadius: 8,
    fontSize: 18,
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#323232",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 6,
    zIndex: 1001,
  },
};
