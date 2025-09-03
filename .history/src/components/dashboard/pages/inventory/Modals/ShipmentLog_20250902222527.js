import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const http = new http_handler();

/**
 * ShipmentLog — Professional UI/UX refactor
 * - LA-timezone aware date handling (server expects YYYY-MM-DD in PST/PDT)
 * - Highlighted dates from past-year shipments
 * - Sticky controls, clean banners, loading overlay (no alerts)
 * - Table with zebra rows; totals bar (shipments + quantity)
 * - Quick nav to previous/next available date
 */
export default function ShipmentLog(props) {
  const { visible, closeHandler } = props;

  const [filterDate, setFilterDate] = useState(new Date());
  const [shipments, setShipments] = useState([]);
  const [highlightedDates, setHighlightedDates] = useState([]); // Date[]

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  // ---------- Time helpers (America/Los_Angeles) ----------
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

  // ---------- Fetchers ----------
  const fetchShipments = async (date) => {
    setLoading(true);
    setError("");
    try {
      const formattedDate = toServerDate(date);
      const res = await http.getShipmentByDate({ date: formattedDate });
      const data = Array.isArray(res?.data) ? res.data : [];
      console.log(data)
      setShipments(data);
      if (data.length === 0) setBanner("No shipments for this date.");
      else setBanner("");
    } catch (e) {
      setError(e?.message || "Failed to fetch shipments");
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlighted = async () => {
    try {
      const res = await http.getPastYearShipments(); // expects an array of date strings
      const dates = (res?.data || []).map((s) => new Date(s));
      setHighlightedDates(dates);
    } catch (e) {
      // non-fatal; we just won't highlight
      console.warn("Failed to fetch highlighted shipment days", e);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    if (!visible) return;
    fetchShipments(filterDate);
    fetchHighlighted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchShipments(filterDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  // ---------- Derived ----------
  const totals = useMemo(() => {
    const count = shipments.length;
    const qty = shipments.reduce(
      (acc, s) => acc + (Number(s.QUANTITY) || 0),
      0
    );
    return { count, qty };
  }, [shipments]);

  const hasHighlights = highlightedDates && highlightedDates.length > 0;

  const findNeighborDate = (direction) => {
    if (!hasHighlights) return null;
    const target = filterDate.setHours(0, 0, 0, 0);
    const sorted = [...highlightedDates]
      .sort((a, b) => a - b)
      .map((d) => d.setHours(0, 0, 0, 0));
    if (direction === "prev") {
      for (let i = sorted.length - 1; i >= 0; i--)
        if (sorted[i] < target) return new Date(sorted[i]);
    } else {
      for (let i = 0; i < sorted.length; i++)
        if (sorted[i] > target) return new Date(sorted[i]);
    }
    return null;
  };

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
      title={"View Product Shipments"}
      closeName={"shipment"}
    >
      <div className="relative">
        <Overlay show={loading} label="Loading shipments..." />

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

          {/* Controls */}
          <div className="sticky top-0 z-[1] -mx-4 mb-3 border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={filterDate}
                  onChange={(d) => d && setFilterDate(d)}
                  highlightDates={highlightedDates}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  dateFormat="yyyy-MM-dd"
                />
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => setFilterDate(new Date())}
                  title="Jump to today"
                >
                  Today
                </button>
                <div className="hidden text-xs text-gray-500 md:block">
                  Highlighted dates have shipments in the past year.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => {
                    const prev = findNeighborDate("prev");
                    if (prev) setFilterDate(prev);
                  }}
                >
                  ← Prev day with shipments
                </button>
                <button
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => {
                    const next = findNeighborDate("next");
                    if (next) setFilterDate(next);
                  }}
                >
                  Next day with shipments →
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
                Shipments:{" "}
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
            {shipments.length === 0 ? (
              <div className="grid place-items-center p-10 text-sm text-gray-500">
                No shipments
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
                  {shipments.map((shipment, index) => (
                    <tr
                      key={shipment.ID}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 border font-mono text-xs text-gray-800">
                        {shipment.PRODUCT_ID}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {shipment.PRODUCT_NAME || "N/A"}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {shipment.QUANTITY}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {formatDisplay(shipment.SHIPMENT_DATE)}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {shipment.COMPANY_ID}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {shipment.EMPLOYEE_NAME || "N/A"}
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
