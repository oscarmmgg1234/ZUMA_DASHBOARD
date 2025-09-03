import React, { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * ActivationLog — Shipment-style UX with bounded probing & cancellation
 * - LA-timezone dates end-to-end (server string + display)
 * - Sticky controls with Today + ← Prev/Next activation day →
 * - Slim info/error banners; loading overlay
 * - Zebra table with sticky header; totals bar (rows + total quantity)
 * - Prev/Next: bounded probe (21 days) + stop at "today" going forward
 * - Cancellation token prevents stale loops from keeping spinner alive
 */
export default function ActivationLog(props) {
  const { visible, closeHandler } = props;

  const [filterDate, setFilterDate] = useState(() => new Date());
  const [activations, setActivations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  // avoid double-fetch when we already fetched during jumpTo()
  const skipNextFetchRef = useRef(false);

  // cancellation / in-flight marker
  const inFlightRef = useRef(0);

  // ---------- Time helpers (America/Los_Angeles) ----------

  const revertTransHandler = async (transID) => {
    const reponse = await http.revertTrans({ transactionID: transID });
    
  };
  const laMidnight = (d) => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const [mm, dd, yyyy] = fmt.split("/");
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0);
  };

  const isAfterTodayLA = (d) => laMidnight(d) > laMidnight(new Date());

  const toServerDate = (date) => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date); // mm/dd/yyyy
    const [mm, dd, yyyy] = fmt.split("/");
    return `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd
  };

  const formatDisplay = (dateLike) => {
    const d = new Date(dateLike);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const [mm, dd, yyyy] = fmt.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateInput = (value) => {
    // value is yyyy-mm-dd; interpret as LA midnight (approx via local Date)
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map((s) => parseInt(s, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  // ---------- Fetchers ----------
  const fetchActivations = async (date) => {
    const requestId = ++inFlightRef.current;
    setLoading(true);
    setError("");
    setBanner("");

    try {
      const res = await http.getActivationByDate({ date: toServerDate(date) });
      if (inFlightRef.current !== requestId) return; // stale

      const data = Array.isArray(res?.data) ? res.data : [];
      setActivations(data);
      setBanner(
        data.length === 0 ? "No product activations for this date." : ""
      );
    } catch (e) {
      if (inFlightRef.current !== requestId) return; // stale
      setError(e?.message || "Failed to fetch activations");
      setActivations([]);
    } finally {
      if (inFlightRef.current === requestId) setLoading(false);
    }
  };

  // Probe previous/next date (bounded) to find the closest day with data
  const jumpToNeighborWithData = async (direction /* 'prev' | 'next' */) => {
    const requestId = ++inFlightRef.current;
    const step = direction === "prev" ? -1 : 1;
    const start = new Date(filterDate);
    const MAX_HOPS = 21; // ~3 weeks window

    setLoading(true);
    setError("");
    setBanner("");

    try {
      for (let i = 1; i <= MAX_HOPS; i++) {
        const candidate = new Date(start);
        candidate.setDate(candidate.getDate() + step * i);

        // Hard ceiling when going forward: don't search past today (LA)
        if (direction === "next" && isAfterTodayLA(candidate)) {
          setBanner("You’re already at the most recent activations.");
          break;
        }

        const res = await http.getActivationByDate({
          date: toServerDate(candidate),
        });

        if (inFlightRef.current !== requestId) return; // stale

        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length > 0) {
          skipNextFetchRef.current = true; // prevent duplicate fetch on date change
          setFilterDate(candidate);
          setActivations(data);
          setBanner("");
          setLoading(false);
          return;
        }
      }

      // nothing found within the bounded window
      setBanner(
        direction === "prev"
          ? "No earlier days with activations within the search window."
          : "No later days with activations within the search window."
      );
    } catch (e) {
      if (inFlightRef.current !== requestId) return; // stale
      setError(e?.message || "Failed searching for nearby days");
    } finally {
      if (inFlightRef.current === requestId) setLoading(false);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    if (!visible) return;
    fetchActivations(filterDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return; // we already set data during jump
    }
    fetchActivations(filterDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  // Clear any in-flight work when modal hides
  useEffect(() => {
    if (!visible) {
      inFlightRef.current += 1; // invalidate any in-flight loops
      setLoading(false);
    }
  }, [visible]);

  // ---------- Derived ----------
  const totals = useMemo(() => {
    const count = activations.length;
    const qty = activations.reduce(
      (acc, a) => acc + (Number(a.QUANTITY) || 0),
      0
    );
    return { count, qty: Number.isFinite(qty) ? Number(qty.toFixed(2)) : 0 };
  }, [activations]);

  // ---------- UI helpers ----------
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
      </div>
    ) : null;

  // ---------- Render ----------
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"View Product Activations"}
      closeName={"activation"}
    >
      <div className="relative">
        <Overlay show={loading} label="Loading activations..." />

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

          {/* Controls (Shipment-style) */}
          <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={toServerDate(filterDate)}
                  onChange={(e) =>
                    setFilterDate(parseDateInput(e.target.value))
                  }
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                />
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => setFilterDate(new Date())}
                  title="Jump to today"
                  disabled={loading}
                >
                  Today
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => jumpToNeighborWithData("prev")}
                  disabled={loading}
                >
                  ← Prev day with activations
                </button>
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => jumpToNeighborWithData("next")}
                  disabled={loading}
                >
                  Next day with activations →
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
            <div>
              Date:{" "}
              <span className="font-medium text-gray-900">
                {formatDisplay(filterDate)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Rows:{" "}
                <span className="font-medium text-gray-900">
                  {totals.count}
                </span>
              </span>
              <span>
                Total Qty:{" "}
                <span className="font-medium text-gray-900">{totals.qty}</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="max-h-[65vh] overflow-auto rounded-2xl border border-gray-200">
            {activations.length === 0 ? (
              <div className="grid place-items-center p-10 text-sm text-gray-500">
                No activations
              </div>
            ) : (
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-2 border">Product ID</th>
                    <th className="px-4 py-2 border">Product Name</th>
                    <th className="px-4 py-2 border">Quantity</th>
                    <th className="px-4 py-2 border">Date (LA)</th>
                    <th className="px-4 py-2 border">Company ID</th>
                    <th className="px-4 py-2 border">Employee</th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((a, index) => (
                    <tr
                      key={a.ACTIVATION_ID || `${a.PRODUCT_ID}-${index}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 border font-mono text-xs text-gray-800">
                        {a.PRODUCT_ID}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {a.PRODUCT_NAME || "N/A"}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {Number(a.QUANTITY) || 0}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {formatDisplay(a.DATE)}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {a.COMPANY_ID ?? "N/A"}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {a.EMPLOYEE_NAME || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
