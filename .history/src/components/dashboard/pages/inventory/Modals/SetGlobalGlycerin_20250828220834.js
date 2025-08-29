import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

// update_companyInfo = async (args) => await updateCompanyInfo(args);
//   manage_companies = async (args) => await manageCompanies(args);
//   update_productCompany = async (args) => await updateProductCompany(args);
//   get_companiesWithProducts = async () => await getCompaniesWithProducts();

//   // --- TYPE ---
//   update_typeInfo = async (args) => await updateTypeInfo(args);
//   manage_types = async (args) => await manageTypes(args);
//   update_productType = async (args) => await updateProductType(args);
//   get_typesWithProducts = async () => await getTypesWithProducts();
//const productsCompanies = await http.get_companiesWithProducts({})
/**
 * SetGlobalGlycerin — Professional UI/UX refactor
 * - Loads current global glycerin unit with overlay and error handling
 * - Edits via a compact card; prevents 0 or unchanged submissions
 * - Clear success banner; keyboard submit (Enter) & ESC to revert
 */
export default function SetGlobalGlycerin({ visible, closeHandler }) {
  const [current, setCurrent] = useState(null); // number | null
  const [draft, setDraft] = useState("1"); // string for controlled input

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const fetchGlobalGlycerin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await http.getGlobalGlycerin();
      const value = result?.data?.glycerinGlobalUnit;
      setCurrent(typeof value === "number" ? value : null);
      setDraft(typeof value === "number" ? String(value) : "1");
    } catch (e) {
      setError(e?.message || "Failed to fetch global glycerin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    fetchGlobalGlycerin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const parsed = useMemo(() => {
    const n = parseFloat(draft);
    return Number.isFinite(n) ? n : NaN;
  }, [draft]);

  const unchanged = useMemo(
    () => current != null && parsed === current,
    [parsed, current]
  );
  const invalid = useMemo(
    () => !Number.isFinite(parsed) || parsed <= 0,
    [parsed]
  );

  const canSave = useMemo(
    () => !saving && !invalid && !unchanged,
    [saving, invalid, unchanged]
  );

  const updateGlycerin = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await http.setGlobalGlycerin({ set_value: parsed });
      setBanner(`Glycerin unit updated to ${parsed}`);
      await fetchGlobalGlycerin();
    } catch (e) {
      setError(e?.message || "Failed to update glycerin unit");
    } finally {
      setSaving(false);
    }
  };

  // UI helpers
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

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title="Set Global Glycerin"
      closeName="GlobalGlycerin"
    >
      <div className="relative">
        <Overlay
          show={loading || saving}
          label={saving ? "Updating glycerin..." : "Loading..."}
        />

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

          <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Current Unit
              </h3>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {current != null ? current : "N/A"}
              </div>
            </div>

            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                New Unit
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min="0"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateGlycerin();
                    if (e.key === "Escape" && current != null)
                      setDraft(String(current));
                  }}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                  placeholder="Enter new glycerin unit"
                />
                <button
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => current != null && setDraft(String(current))}
                >
                  Reset
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Must be a positive number. Zero and unchanged values are not
                allowed.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                onClick={updateGlycerin}
                disabled={!canSave}
              >
                {saving ? (
                  <>
                    <Spinner /> Updating
                  </>
                ) : (
                  "Update Glycerin Unit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
