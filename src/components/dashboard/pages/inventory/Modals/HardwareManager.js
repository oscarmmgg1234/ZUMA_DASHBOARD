import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * HardwareManager — Professional UI/UX refactor
 * - Lists scanners with search (by id, label, type, employee)
 * - Badges for status, clean table, sticky search
 * - Add new scanner with validation + optimistic update
 * - Delete with confirm + per-row spinner
 */
export default function HardwareManager(props) {
  const { visible, closeHandler } = props;

  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const [search, setSearch] = useState("");
  const [busyRow, setBusyRow] = useState(null); // id currently deleting
  const [creating, setCreating] = useState(false);

  const [newScanner, setNewScanner] = useState({
    id: "",
    status: 0, // 0 Disconnected, 1 Connected
    type_desc: "Reduction Scanner",
    assigned_employee: "",
    label: "",
  });

  // -------------------- Init --------------------
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await http.getScannerData();
        setScanners(data?.scanners || []);
      } catch (e) {
        setError(e?.message || "Failed to load hardware");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  // -------------------- Derived --------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scanners;
    return scanners.filter((s) => {
      const id = String(s.id || "").toLowerCase();
      const label = String(s.label || "").toLowerCase();
      const type = String(s.type_desc || "").toLowerCase();
      const emp = String(s.assigned_employee || "").toLowerCase();
      return (
        id.includes(q) ||
        label.includes(q) ||
        type.includes(q) ||
        emp.includes(q)
      );
    });
  }, [scanners, search]);

  // -------------------- Helpers --------------------
  const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
  );

  const Overlay = ({ show, label }) =>
    show ? (
      <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow">
          <Spinner />
          <span className="text-sm text-gray-700">{label || "Working..."}</span>
        </div>
      </div>
    ) : null;

  const Badge = ({ tone = "slate", children }) => (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium bg-${tone}-50 text-${tone}-700`}
    >
      {children}
    </span>
  );
  // If using strict Tailwind purge, whitelist the above bg-*/text-* classes.

  const StatusBadge = ({ status }) =>
    status === 1 ? (
      <Badge tone="emerald">Connected</Badge>
    ) : (
      <Badge tone="rose">Disconnected</Badge>
    );

  // -------------------- Actions --------------------
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await http.getScannerData();
      setScanners(data?.scanners || []);
    } catch (e) {
      setError(e?.message || "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const deleteHardware = async (id) => {
    if (!id) return;
    if (!confirm("Delete this scanner? This cannot be undone.")) return;
    setBusyRow(id);
    setError("");
    try {
      await http.deleteScanner(id);
      setScanners((prev) => prev.filter((s) => s.id !== id));
      setBanner(`Deleted scanner ${id}`);
    } catch (e) {
      setError(e?.message || "Failed to delete scanner");
    } finally {
      setBusyRow(null);
    }
  };

  const addHardware = async () => {
    setError("");
    // Basic validation
    const id = newScanner.id.trim();
    if (!id) return setError("Scanner ID is required");
    if (scanners.some((s) => String(s.id) === id))
      return setError("Scanner ID already exists");

    const payload = {
      id,
      status: Number(newScanner.status) === 1 ? 1 : 0,
      type_desc: newScanner.type_desc?.trim() || "Scanner",
      assigned_employee: newScanner.assigned_employee?.trim() || null,
      label: newScanner.label?.trim() || "",
    };

    setCreating(true);
    try {
      const res = await http.addScanner(payload);
      // Prefer backend echo, else payload
      const created = res?.scanner || payload;
      setScanners((prev) => [...prev, created]);
      setBanner(`Added scanner ${created.id}`);
      setNewScanner({
        id: "",
        status: 0,
        type_desc: "Reduction Scanner",
        assigned_employee: "",
        label: "",
      });
    } catch (e) {
      setError(e?.message || "Failed to add scanner");
    } finally {
      setCreating(false);
    }
  };

  // -------------------- Render --------------------
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title={"Manage Hardware"}
      closeName={"hardware"}
    >
      <div className="relative">
        <Overlay show={loading} label="Loading hardware..." />

        <div className="p-4">
          {banner && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {banner}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="sticky top-0 z-[1] -mx-4 mb-4 border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20 md:max-w-md"
                placeholder="Search by ID, label, type, or employee"
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={refresh}
                  className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mb-6 h-[44vh] overflow-auto rounded-2xl border border-gray-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-2 border">ID</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Label</th>
                  <th className="px-4 py-2 border">Employee</th>
                  <th className="px-4 py-2 border text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No hardware found
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-4 py-2 border font-mono text-xs text-gray-800">
                        {s.id}
                      </td>
                      <td className="px-4 py-2 border">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {s.type_desc || "—"}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {s.label || "—"}
                      </td>
                      <td className="px-4 py-2 border text-gray-900">
                        {s.assigned_employee || "—"}
                      </td>
                      <td className="px-4 py-2 border text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                            onClick={() => deleteHardware(s.id)}
                            disabled={busyRow === s.id}
                          >
                            {busyRow === s.id ? (
                              <>
                                <Spinner /> Deleting
                              </>
                            ) : (
                              "Delete"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add New */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Add New Scanner
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  ID
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Unique ID"
                  value={newScanner.id}
                  onChange={(e) =>
                    setNewScanner((s) => ({ ...s, id: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Status
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  value={newScanner.status}
                  onChange={(e) =>
                    setNewScanner((s) => ({
                      ...s,
                      status: Number(e.target.value),
                    }))
                  }
                >
                  <option value={0}>Disconnected</option>
                  <option value={1}>Connected</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Type
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="e.g., Reduction Scanner"
                  value={newScanner.type_desc}
                  onChange={(e) =>
                    setNewScanner((s) => ({ ...s, type_desc: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Assigned Employee
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Optional"
                  value={newScanner.assigned_employee}
                  onChange={(e) =>
                    setNewScanner((s) => ({
                      ...s,
                      assigned_employee: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Label
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Optional"
                  value={newScanner.label}
                  onChange={(e) =>
                    setNewScanner((s) => ({ ...s, label: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-5 flex items-end justify-end">
                <button
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  onClick={addHardware}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Spinner /> Adding
                    </>
                  ) : (
                    "Add Scanner"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
