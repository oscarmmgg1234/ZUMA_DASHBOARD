import React, { useState, useEffect } from "react";
import http_handler from "../../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

// 8-char ID
function generateShortUUID() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function CustomProduct(props) {
  // ===== Global color macro =====
  const [textColor, setTextColor] = useState("#222"); // change here to affect all text/input colors

  // ===== Core IDs / phase =====
  const [productID, setProductID] = useState(generateShortUUID());
  const [phase, setPhase] = useState("pool-setup");
  const [isLoading, setIsLoading] = useState(false);

  // ===== Notifications =====
  const [notification, setNotification] = useState({ message: "", visible: false });
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
  const [linkStatus, setLinkStatus] = useState(null);

  // ===== Product form =====
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
    company: "",
    unitType: "",
  });
  const [createLabel, setCreateLabel] = useState(false);
  const [needBarcode, setNeedBarcode] = useState(false);

  const requiredFields = ["name", "price", "type", "company", "unitType"];

  function buildProductPacket() {
    for (const f of requiredFields) {
      const v = (formFields[f] ?? "").toString().trim();
      if (!v) throw new Error(`Missing required field: ${f}`);
    }
    const priceNum = Number(formFields.price);
    if (Number.isNaN(priceNum) || priceNum < 0) throw new Error("Price must be a non-negative number");

    const currentPoolRef = usePool && linkStatus?.linked ? linkStatus.poolID : null;
    return {
      PRODUCT_ID: productID,
      name: formFields.name.trim(),
      description: (formFields.description ?? "").trim(),
      price: priceNum,
      type: formFields.type,
      company: formFields.company,
      unitType: formFields.unitType,
      createLabel,
      needBarcode,
      currentPoolRef,
      _meta: {
        normalizeRatio: linkStatus?.linked ? linkStatus.ratio : normalizeRatio,
        linked: !!linkStatus?.linked,
        phase,
      },
    };
  }

  const handleCreateProduct = async () => {
    if (usePool && !linkStatus?.linked) {
      return toast("Link the product to a pool first, or disable pool usage.");
    }
    try {
      const packet = buildProductPacket();
      console.log("[createProduct packet]", packet);
      await http.addProductProcess(packet);
      toast("Compiled product packet logged to console.");
      setProductID(generateShortUUID());
      setFormFields({ name: "", description: "", price: "", type: "", company: "", unitType: "" });
      setCreateLabel(false);
      setNeedBarcode(false);
      setUsePool(true);
      setCreatingPool(false);
      setPoolName("");
      setSelectedPoolId("");
      setNormalizeRatio(1);
      setLinkStatus(null);
      setPhase("pool-setup");
    } catch (err) {
      console.error("Packet build failed:", err);
      toast(err.message || "Invalid form data.");
    }
  };

  const canRegenerateID = !usePool || !linkStatus?.linked;
  const safeRegenerate = () => {
    if (!canRegenerateID) {
      toast("Unlink from pool to change PRODUCT_ID.");
      return;
    }
    setProductID(generateShortUUID());
  };

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

  const propChange = (e) => setFormFields((s) => ({ ...s, [e.target.name]: e.target.value }));
  const isFilled = (f) => (formFields[f] ?? "").toString().trim() !== "";

  const handleLinkPool = async () => {
    if (!usePool) {
      setLinkStatus(null);
      setPhase("form");
      return;
    }
    if (creatingPool) {
      if (!poolName.trim()) return toast("Enter a pool name.");
    } else {
      if (!selectedPoolId) return toast("Select a pool to link.");
    }
    try {
      setIsLoading(true);
      if (creatingPool) {
        const res = await http.createVirtualPools({
          name: poolName.trim(),
          virtualStock: 0,
          productID,
          normalizeRatio,
        });
        if (res?.createdTable) {
          const pools = await http.getVirtualStockPools();
          setVirtualPools(pools.arr || []);
          const created = (pools.arr || []).find((p) => p.name === poolName.trim());
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
    <div style={styles.container(textColor)}>
      {/* ...rest of JSX identical except: 
           every styles.label() → styles.label(textColor)
           every styles.input() → styles.input(isFilled(...), textColor)
           anywhere color hardcoded → textColor */}
    </div>
  );
}

const styles = {
  container: (color) => ({
    maxWidth: "920px",
    margin: "auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color,
  }),
  label: (color) => ({ marginBottom: 4, fontWeight: 600, fontSize: 12, color }),
  input: (filled, color) => ({
    padding: "10px",
    border: filled ? "2px solid #43a047" : "1px solid #aaa",
    borderRadius: 6,
    fontSize: 14,
    background: "#fff",
    color,
  }),
  // ...other styles unchanged
};
