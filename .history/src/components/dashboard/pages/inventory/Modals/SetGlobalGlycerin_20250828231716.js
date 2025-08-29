import React, { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

// Shared tiny spinner (module-scope)
const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]" />
);

// 8-char UUID (4 random bytes → hex)
function genId8() {
  const bytes = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // fallback (non-crypto) — fine for UI ids; DB still validates uniqueness
    for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function SetGlobalGlycerin({ visible, closeHandler }) {
  // section toggles
  const [open, setOpen] = useState({
    glycerin: true,
    types: false,
    companies: false,
  });

  // ========== GLYCERIN ==========
  const [glyCurrent, setGlyCurrent] = useState(null);
  const [glyDraft, setGlyDraft] = useState("1");
  const [glyLoading, setGlyLoading] = useState(false);
  const [glySaving, setGlySaving] = useState(false);
  const [glyBanner, setGlyBanner] = useState("");
  const [glyError, setGlyError] = useState("");

  const GALLON_ML = 3785.41;

  const loadGlycerin = async () => {
    setGlyLoading(true);
    setGlyBanner("");
    setGlyError("");
    try {
      const res = await http.getGlobalGlycerin();
      const v = res?.data?.glycerinGlobalUnit;
      setGlyCurrent(typeof v === "number" ? v : null);
      setGlyDraft(typeof v === "number" ? String(v) : "1");
    } catch (e) {
      setGlyError(e?.message || "Failed to fetch global glycerin");
    } finally {
      setGlyLoading(false);
    }
  };

  const glyParsed = useMemo(() => {
    const n = parseFloat(glyDraft);
    return Number.isFinite(n) ? n : NaN;
  }, [glyDraft]);
  const glyUnchanged = useMemo(
    () => glyCurrent != null && glyParsed === glyCurrent,
    [glyParsed, glyCurrent]
  );
  const glyInvalid = useMemo(
    () => !Number.isFinite(glyParsed) || glyParsed <= 0,
    [glyParsed]
  );
  const glyCanSave = useMemo(
    () => !glySaving && !glyInvalid && !glyUnchanged,
    [glySaving, glyInvalid, glyUnchanged]
  );
  const glyPreview = useMemo(
    () =>
      Number.isFinite(glyParsed)
        ? (glyParsed * GALLON_ML).toLocaleString()
        : null,
    [glyParsed]
  );

  const saveGlycerin = async () => {
    if (!glyCanSave) return;
    setGlySaving(true);
    setGlyError("");
    try {
      await http.setGlobalGlycerin({ set_value: glyParsed });
      setGlyBanner(`Glycerin unit updated to ${glyParsed}`);
      await loadGlycerin();
    } catch (e) {
      setGlyError(e?.message || "Failed to update glycerin unit");
    } finally {
      setGlySaving(false);
    }
  };

  // ========== TYPES ==========
  const [types, setTypes] = useState([]); // [{type, productArr}]
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesMsg, setTypesMsg] = useState({ ok: "", err: "" });
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedTypeID, setSelectedTypeID] = useState("");
  const [typeCreating, setTypeCreating] = useState(false);

  // selection state (PRODUCT_IDs) for the currently selected type
  const [typeSelectedIds, setTypeSelectedIds] = useState(new Set());
  const [typeBulkTarget, setTypeBulkTarget] = useState("");
  const [typeBulkMoving, setTypeBulkMoving] = useState(false);

  const loadTypes = async () => {
    setTypesLoading(true);
    setTypesMsg({ ok: "", err: "" });
    try {
      const res = await http.get_typesWithProducts();
      setTypes(Array.isArray(res) ? res : []);
      if (Array.isArray(res) && res.length > 0) {
        setSelectedTypeID(res[0].type.TYPE_ID);
      } else {
        setSelectedTypeID("");
      }
      setTypeSelectedIds(new Set()); // reset selection
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to load types" });
    } finally {
      setTypesLoading(false);
    }
  };

  const selectedType = useMemo(
    () => types.find((t) => t?.type?.TYPE_ID === selectedTypeID),
    [types, selectedTypeID]
  );

  // Reset selection whenever selected type changes
  useEffect(() => {
    setTypeSelectedIds(new Set());
  }, [selectedTypeID]);

  const filteredTypes = useMemo(() => {
    const q = typeFilter.trim().toLowerCase();
    if (!q) return types;
    return types.filter(({ type }) =>
      [type.TYPE_ID, type.TYPE, type.DESCRIPTION, type.RISK]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [typeFilter, types]);

  const createType = async (payload) => {
    if (!payload?.TYPE_ID || !payload?.TYPE) {
      setTypesMsg({ ok: "", err: "TYPE_ID and TYPE are required." });
      return;
    }
    setTypeCreating(true);
    try {
      const res = await http.manage_types({ ...payload, option: "create" });
      if (res?.success)
        setTypesMsg({
          ok: `Created type ${payload.TYPE} (${payload.TYPE_ID})`,
          err: "",
        });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to create type" });
    } finally {
      setTypeCreating(false);
    }
  };

  const deleteType = async (TYPE_ID, hasProducts) => {
    if (hasProducts) return;
    try {
      const res = await http.manage_types({ TYPE_ID, option: "delete" });
      if (res?.success) setTypesMsg({ ok: `Deleted type ${TYPE_ID}`, err: "" });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to delete type" });
    }
  };

  const updateTypeFields = async (TYPE_ID, changes) => {
    try {
      const res = await http.update_typeInfo({ typeID: TYPE_ID, changes });
      if (res?.success) setTypesMsg({ ok: `Updated type ${TYPE_ID}`, err: "" });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to update type" });
    }
  };

  const reassignTypeSingle = async (PRODUCT_ID, toTYPE_ID) => {
    try {
      const res = await http.update_productType({
        productID: PRODUCT_ID,
        typeID: toTYPE_ID,
        option: "single",
      });
      if (res?.success)
        setTypesMsg({
          ok: `Moved product ${PRODUCT_ID} → ${toTYPE_ID}`,
          err: "",
        });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to move product" });
    }
  };

  const toggleTypeOne = (productID) => {
    setTypeSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productID)) next.delete(productID);
      else next.add(productID);
      return next;
    });
  };

  const toggleTypeAll = (allIds, check) => {
    setTypeSelectedIds(() => {
      if (!check) return new Set();
      return new Set(allIds);
    });
  };

  const moveSelectedTypeProducts = async () => {
    const fromID = selectedType?.type?.TYPE_ID;
    const toID = typeBulkTarget;
    if (!fromID || !toID || toID === fromID || typeSelectedIds.size === 0)
      return;

    setTypeBulkMoving(true);
    setTypesMsg({ ok: "", err: "" });
    try {
      let count = 0;
      for (const id of typeSelectedIds) {
        await http.update_productType({
          productID: id,
          typeID: toID,
          option: "single",
        });
        count++;
      }
      setTypesMsg({
        ok: `Moved ${count} product(s) from ${fromID} → ${toID}`,
        err: "",
      });
      setTypeSelectedIds(new Set());
      setTypeBulkTarget("");
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Move selected failed" });
    } finally {
      setTypeBulkMoving(false);
    }
  };

  // ========== COMPANIES ==========
  const [companies, setCompanies] = useState([]); // [{company, productArr}]
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesMsg, setCompaniesMsg] = useState({ ok: "", err: "" });
  const [companyFilter, setCompanyFilter] = useState("");
  const [selectedCompanyID, setSelectedCompanyID] = useState("");
  const [companyCreating, setCompanyCreating] = useState(false);

  // selection state for currently selected company
  const [companySelectedIds, setCompanySelectedIds] = useState(new Set());
  const [companyBulkTarget, setCompanyBulkTarget] = useState("");
  const [companyBulkMoving, setCompanyBulkMoving] = useState(false);

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesMsg({ ok: "", err: "" });
    try {
      const res = await http.get_companiesWithProducts();
      setCompanies(Array.isArray(res) ? res : []);
      if (Array.isArray(res) && res.length > 0) {
        setSelectedCompanyID(res[0].company.COMPANY_ID);
      } else {
        setSelectedCompanyID("");
      }
      setCompanySelectedIds(new Set());
    } catch (e) {
      setCompaniesMsg({
        ok: "",
        err: e?.message || "Failed to load companies",
      });
    } finally {
      setCompaniesLoading(false);
    }
  };

  const selectedCompany = useMemo(
    () => companies.find((c) => c?.company?.COMPANY_ID === selectedCompanyID),
    [companies, selectedCompanyID]
  );

  // Reset selection on company change
  useEffect(() => {
    setCompanySelectedIds(new Set());
  }, [selectedCompanyID]);

  const filteredCompanies = useMemo(() => {
    const q = companyFilter.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(({ company }) =>
      [
        company.COMPANY_ID,
        company.NAME,
        company.ADDRESS,
        company.TYPE,
        company.PHONE,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [companyFilter, companies]);

  const createCompany = async (payload) => {
    if (!payload?.COMPANY_ID || !payload?.NAME) {
      setCompaniesMsg({ ok: "", err: "COMPANY_ID and NAME are required." });
      return;
    }
    setCompanyCreating(true);
    try {
      const res = await http.manage_companies({ ...payload, option: "create" });
      if (res?.success)
        setCompaniesMsg({
          ok: `Created company ${payload.NAME} (${payload.COMPANY_ID})`,
          err: "",
        });
      await loadCompanies();
    } catch (e) {
      setCompaniesMsg({
        ok: "",
        err: e?.message || "Failed to create company",
      });
    } finally {
      setCompanyCreating(false);
    }
  };

  const deleteCompany = async (COMPANY_ID, hasProducts) => {
    if (hasProducts) return;
    try {
      const res = await http.manage_companies({ COMPANY_ID, option: "delete" });
      if (res?.success)
        setCompaniesMsg({ ok: `Deleted company ${COMPANY_ID}`, err: "" });
      await loadCompanies();
    } catch (e) {
      setCompaniesMsg({
        ok: "",
        err: e?.message || "Failed to delete company",
      });
    }
  };

  const updateCompanyFields = async (COMPANY_ID, changes) => {
    try {
      const res = await http.update_companyInfo({
        companyID: COMPANY_ID,
        changes,
      });
      if (res?.success)
        setCompaniesMsg({ ok: `Updated company ${COMPANY_ID}`, err: "" });
      await loadCompanies();
    } catch (e) {
      setCompaniesMsg({
        ok: "",
        err: e?.message || "Failed to update company",
      });
    }
  };

  const reassignCompanySingle = async (PRODUCT_ID, toCOMPANY_ID) => {
    try {
      const res = await http.update_productCompany({
        productID: PRODUCT_ID,
        companyID: toCOMPANY_ID,
        option: "single",
      });
      if (res?.success)
        setCompaniesMsg({
          ok: `Moved product ${PRODUCT_ID} → ${toCOMPANY_ID}`,
          err: "",
        });
      await loadCompanies();
    } catch (e) {
      setCompaniesMsg({ ok: "", err: e?.message || "Failed to move product" });
    }
  };

  const toggleCompanyOne = (productID) => {
    setCompanySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productID)) next.delete(productID);
      else next.add(productID);
      return next;
    });
  };

  const toggleCompanyAll = (allIds, check) => {
    setCompanySelectedIds(() => {
      if (!check) return new Set();
      return new Set(allIds);
    });
  };

  const moveSelectedCompanyProducts = async () => {
    const fromID = selectedCompany?.company?.COMPANY_ID;
    const toID = companyBulkTarget;
    if (!fromID || !toID || toID === fromID || companySelectedIds.size === 0)
      return;

    setCompanyBulkMoving(true);
    setCompaniesMsg({ ok: "", err: "" });
    try {
      let count = 0;
      for (const id of companySelectedIds) {
        await http.update_productCompany({
          productID: id,
          companyID: toID,
          option: "single",
        });
        count++;
      }
      setCompaniesMsg({
        ok: `Moved ${count} product(s) from ${fromID} → ${toID}`,
        err: "",
      });
      setCompanySelectedIds(new Set());
      setCompanyBulkTarget("");
      await loadCompanies();
    } catch (e) {
      setCompaniesMsg({ ok: "", err: e?.message || "Move selected failed" });
    } finally {
      setCompanyBulkMoving(false);
    }
  };

  // lifecycle
  useEffect(() => {
    if (!visible) return;
    loadGlycerin();
    loadTypes();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // UI atoms
  const Card = ({ title, subtitle, open, onToggle, children }) => (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="text-left">
          <h2 className="text-sm font-semibold text-black">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-gray-600">{subtitle}</p>
          ) : null}
        </div>
        <div className="text-gray-500">{open ? "▾" : "▸"}</div>
      </button>
      {open ? <div className="border-t border-gray-100">{children}</div> : null}
    </div>
  );

  const Input = (props) => (
    <input
      {...props}
      className={
        "rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-gray-900/15 " +
        (props.className || "")
      }
    />
  );

  const Btn = ({ tone = "primary", className = "", ...p }) => {
    const base = "rounded-xl px-3 py-2 text-sm font-medium";
    const map = {
      primary: "bg-black text-white hover:bg-gray-800",
      light: "bg-gray-100 text-black hover:bg-gray-200",
      danger: "bg-rose-600 text-white hover:bg-rose-700",
      subtle: "bg-white text-black border border-gray-300 hover:bg-gray-50",
    };
    return <button {...p} className={`${base} ${map[tone]} ${className}`} />;
  };

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title="Set Global Glycerin"
      closeName="GlobalGlycerin"
    >
      <div className="space-y-4 p-4 text-black">
        {/* Glycerin */}
        <Card
          title="Glycerin Configuration"
          subtitle="Manage the global glycerin unit used across calculations."
          open={open.glycerin}
          onToggle={() => setOpen((s) => ({ ...s, glycerin: !s.glycerin }))}
        >
          <div className="p-4 space-y-3">
            {glyBanner && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {glyBanner}
              </div>
            )}
            {glyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {glyError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Current Unit
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {glyLoading ? <Spinner /> : glyCurrent ?? "N/A"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  New Unit
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    min="0"
                    value={glyDraft}
                    onChange={(e) => setGlyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveGlycerin();
                      if (e.key === "Escape" && glyCurrent != null)
                        setGlyDraft(String(glyCurrent));
                    }}
                    placeholder="Enter new glycerin unit"
                  />
                  <Btn
                    tone="light"
                    onClick={() =>
                      glyCurrent != null && setGlyDraft(String(glyCurrent))
                    }
                  >
                    Reset
                  </Btn>
                  <Btn
                    tone="primary"
                    onClick={saveGlycerin}
                    disabled={!glyCanSave}
                  >
                    {glySaving ? (
                      <>
                        <Spinner /> <span className="ml-1">Saving</span>
                      </>
                    ) : (
                      "Save"
                    )}
                  </Btn>
                </div>
                <p className="mt-2 text-xs text-gray-700">
                  Note: this number will be multiplied against 1 gallon in mL
                  (3785.41). Example:&nbsp;
                  <span className="font-medium">
                    {Number.isFinite(glyParsed) ? glyParsed : "N"}
                  </span>
                  {" × 3785.41 = "}
                  <span className="font-medium">{glyPreview ?? "—"}</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Types */}
        <Card
          title="Product Types"
          subtitle="Create, edit, reassign, and batch move selected products."
          open={open.types}
          onToggle={() => setOpen((s) => ({ ...s, types: !s.types }))}
        >
          <TypesPanel
            // data + state
            types={types}
            typesLoading={typesLoading}
            typesMsg={typesMsg}
            selectedTypeID={selectedTypeID}
            setSelectedTypeID={setSelectedTypeID}
            filteredTypes={filteredTypes}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            selectedType={selectedType}
            // CRUD
            createType={createType}
            typeCreating={typeCreating}
            deleteType={deleteType}
            updateTypeFields={updateTypeFields}
            // per-product
            reassignTypeSingle={reassignTypeSingle}
            // selection + batch
            typeSelectedIds={typeSelectedIds}
            toggleTypeOne={toggleTypeOne}
            toggleTypeAll={toggleTypeAll}
            typeBulkTarget={typeBulkTarget}
            setTypeBulkTarget={setTypeBulkTarget}
            typeBulkMoving={typeBulkMoving}
            moveSelectedTypeProducts={moveSelectedTypeProducts}
          />
        </Card>

        {/* Companies */}
        <Card
          title="Companies"
          subtitle="Create, edit, reassign, and batch move selected products."
          open={open.companies}
          onToggle={() => setOpen((s) => ({ ...s, companies: !s.companies }))}
        >
          <CompaniesPanel
            // data + state
            companies={companies}
            companiesLoading={companiesLoading}
            companiesMsg={companiesMsg}
            selectedCompanyID={selectedCompanyID}
            setSelectedCompanyID={setSelectedCompanyID}
            filteredCompanies={filteredCompanies}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            selectedCompany={selectedCompany}
            // CRUD
            createCompany={createCompany}
            companyCreating={companyCreating}
            deleteCompany={deleteCompany}
            updateCompanyFields={updateCompanyFields}
            // per-product
            reassignCompanySingle={reassignCompanySingle}
            // selection + batch
            companySelectedIds={companySelectedIds}
            toggleCompanyOne={toggleCompanyOne}
            toggleCompanyAll={toggleCompanyAll}
            companyBulkTarget={companyBulkTarget}
            setCompanyBulkTarget={setCompanyBulkTarget}
            companyBulkMoving={companyBulkMoving}
            moveSelectedCompanyProducts={moveSelectedCompanyProducts}
          />
        </Card>
      </div>
    </BaseModal>
  );
}

/* ---------- Panels & Subcomponents ---------- */

function TypesPanel({
  types,
  typesLoading,
  typesMsg,
  selectedTypeID,
  setSelectedTypeID,
  filteredTypes,
  typeFilter,
  setTypeFilter,
  selectedType,
  createType,
  typeCreating,
  deleteType,
  updateTypeFields,
  reassignTypeSingle,
  typeSelectedIds,
  toggleTypeOne,
  toggleTypeAll,
  typeBulkTarget,
  setTypeBulkTarget,
  typeBulkMoving,
  moveSelectedTypeProducts,
}) {
  return (
    <div className="p-4 space-y-4">
      {typesMsg.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {typesMsg.ok}
        </div>
      )}
      {typesMsg.err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {typesMsg.err}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-gray-900/15"
            placeholder="Filter types…"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>

        <CreateTypeRow onCreate={createType} creating={typeCreating} />
      </div>

      {/* Selector + batch controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
          value={selectedTypeID}
          onChange={(e) => setSelectedTypeID(e.target.value)}
        >
          {filteredTypes.map(({ type }) => (
            <option key={type.TYPE_ID} value={type.TYPE_ID}>
              {type.TYPE} ({type.TYPE_ID})
            </option>
          ))}
        </select>

        {selectedType && (
          <>
            <span className="text-xs text-gray-600">Move selected to:</span>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
              value={typeBulkTarget}
              onChange={(e) => setTypeBulkTarget(e.target.value)}
            >
              <option value="">Select target type…</option>
              {types
                .filter((t) => t?.type?.TYPE_ID !== selectedType?.type?.TYPE_ID)
                .map((t) => (
                  <option key={t.type.TYPE_ID} value={t.type.TYPE_ID}>
                    {t.type.TYPE} ({t.type.TYPE_ID})
                  </option>
                ))}
            </select>
            <button
              className="rounded-xl px-3 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={
                typeBulkMoving ||
                !typeBulkTarget ||
                typeBulkTarget === selectedType?.type?.TYPE_ID ||
                typeSelectedIds.size === 0
              }
              onClick={moveSelectedTypeProducts}
            >
              {typeBulkMoving ? (
                <>
                  <Spinner /> <span className="ml-1">Moving…</span>
                </>
              ) : (
                `Move Selected (${typeSelectedIds.size})`
              )}
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-gray-600">
          {typesLoading ? <Spinner /> : `${types.length} total`}
        </span>
      </div>

      {selectedType ? (
        <TypeDetailCard
          types={types}
          item={selectedType}
          onDelete={deleteType}
          onUpdateFields={updateTypeFields}
          onReassignSingle={reassignTypeSingle}
          // selection props
          selectedIds={typeSelectedIds}
          toggleOne={toggleTypeOne}
          toggleAll={toggleTypeAll}
        />
      ) : (
        <div className="text-sm text-gray-600">
          {typesLoading ? "Loading…" : "No types yet. Create one above."}
        </div>
      )}
    </div>
  );
}

function CompaniesPanel({
  companies,
  companiesLoading,
  companiesMsg,
  selectedCompanyID,
  setSelectedCompanyID,
  filteredCompanies,
  companyFilter,
  setCompanyFilter,
  selectedCompany,
  createCompany,
  companyCreating,
  deleteCompany,
  updateCompanyFields,
  reassignCompanySingle,
  companySelectedIds,
  toggleCompanyOne,
  toggleCompanyAll,
  companyBulkTarget,
  setCompanyBulkTarget,
  companyBulkMoving,
  moveSelectedCompanyProducts,
}) {
  return (
    <div className="p-4 space-y-4">
      {companiesMsg.ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {companiesMsg.ok}
        </div>
      )}
      {companiesMsg.err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {companiesMsg.err}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-gray-900/15"
            placeholder="Filter companies…"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          />
        </div>

        <CreateCompanyRow onCreate={createCompany} creating={companyCreating} />
      </div>

      {/* Selector + batch controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
          value={selectedCompanyID}
          onChange={(e) => setSelectedCompanyID(e.target.value)}
        >
          {filteredCompanies.map(({ company }) => (
            <option key={company.COMPANY_ID} value={company.COMPANY_ID}>
              {company.NAME} ({company.COMPANY_ID})
            </option>
          ))}
        </select>

        {selectedCompany && (
          <>
            <span className="text-xs text-gray-600">Move selected to:</span>
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
              value={companyBulkTarget}
              onChange={(e) => setCompanyBulkTarget(e.target.value)}
            >
              <option value="">Select target company…</option>
              {companies
                .filter(
                  (c) =>
                    c?.company?.COMPANY_ID !==
                    selectedCompany?.company?.COMPANY_ID
                )
                .map((c) => (
                  <option
                    key={c.company.COMPANY_ID}
                    value={c.company.COMPANY_ID}
                  >
                    {c.company.NAME} ({c.company.COMPANY_ID})
                  </option>
                ))}
            </select>
            <button
              className="rounded-xl px-3 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={
                companyBulkMoving ||
                !companyBulkTarget ||
                companyBulkTarget === selectedCompany?.company?.COMPANY_ID ||
                companySelectedIds.size === 0
              }
              onClick={moveSelectedCompanyProducts}
            >
              {companyBulkMoving ? (
                <>
                  <Spinner /> <span className="ml-1">Moving…</span>
                </>
              ) : (
                `Move Selected (${companySelectedIds.size})`
              )}
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-gray-600">
          {companiesLoading ? <Spinner /> : `${companies.length} total`}
        </span>
      </div>

      {selectedCompany ? (
        <CompanyDetailCard
          companies={companies}
          item={selectedCompany}
          onDelete={deleteCompany}
          onUpdateFields={updateCompanyFields}
          onReassignSingle={reassignCompanySingle}
          // selection props
          selectedIds={companySelectedIds}
          toggleOne={toggleCompanyOne}
          toggleAll={toggleCompanyAll}
        />
      ) : (
        <div className="text-sm text-gray-600">
          {companiesLoading
            ? "Loading…"
            : "No companies yet. Create one above."}
        </div>
      )}
    </div>
  );
}

/* ---------- Creating Rows ---------- */
function CreateTypeRow({ onCreate, creating }) {
  const [draft, setDraft] = useState({ TYPE: "", DESCRIPTION: "", RISK: "" });

  const handleCreate = () => {
    const TYPE_ID = genId8();
    onCreate({ ...draft, TYPE_ID });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-gray-600">
          Create Type
        </div>
        <div className="text-[11px] text-gray-500">
          ID will be auto-generated (8 chars)
        </div>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="TYPE *"
          value={draft.TYPE}
          onChange={(e) => setDraft((s) => ({ ...s, TYPE: e.target.value }))}
        />
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="DESCRIPTION"
          value={draft.DESCRIPTION ?? ""}
          onChange={(e) =>
            setDraft((s) => ({ ...s, DESCRIPTION: e.target.value }))
          }
        />
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm flex-1"
            placeholder="RISK"
            value={draft.RISK ?? ""}
            onChange={(e) => setDraft((s) => ({ ...s, RISK: e.target.value }))}
          />
          <button
            className="rounded-xl px-3 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            onClick={handleCreate}
            disabled={creating || !draft.TYPE.trim()}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


function CreateCompanyRow({ onCreate, creating }) {
  const [draft, setDraft] = useState({
    COMPANY_ID: "",
    NAME: "",
    ADDRESS: "",
    TYPE: "",
    PHONE: "",
  });
  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="text-xs font-semibold uppercase text-gray-600">
        Create Company
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-5">
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="COMPANY_ID *"
          value={draft.COMPANY_ID}
          onChange={(e) =>
            setDraft((s) => ({ ...s, COMPANY_ID: e.target.value }))
          }
        />
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="NAME *"
          value={draft.NAME}
          onChange={(e) => setDraft((s) => ({ ...s, NAME: e.target.value }))}
        />
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="ADDRESS"
          value={draft.ADDRESS ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, ADDRESS: e.target.value }))}
        />
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="TYPE (ref)"
          value={draft.TYPE ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, TYPE: e.target.value }))}
        />
        <div className="flex gap-2">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm flex-1"
            placeholder="PHONE"
            value={draft.PHONE ?? ""}
            onChange={(e) => setDraft((s) => ({ ...s, PHONE: e.target.value }))}
          />
          <button
            className="rounded-xl px-3 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            onClick={() => onCreate(draft)}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Detail Cards with selection ---------- */

function TypeDetailCard({
  types,
  item,
  onDelete,
  onUpdateFields,
  onReassignSingle,
  selectedIds,
  toggleOne,
  toggleAll,
}) {
  const { type, productArr } = item || {};
  const hasProducts = (productArr?.length || 0) > 0;

  const [t, setT] = useState({
    TYPE: type.TYPE,
    DESCRIPTION: type.DESCRIPTION ?? "",
    RISK: type.RISK ?? "",
  });
  useEffect(
    () =>
      setT({
        TYPE: type.TYPE,
        DESCRIPTION: type.DESCRIPTION ?? "",
        RISK: type.RISK ?? "",
      }),
    [type]
  );

  const save = (key) => onUpdateFields(type.TYPE_ID, [{ key, value: t[key] }]);

  const allIds = (productArr || []).map((p) => p.PRODUCT_ID);
  const allChecked = hasProducts && allIds.every((id) => selectedIds.has(id));
  const someChecked =
    hasProducts && !allChecked && allIds.some((id) => selectedIds.has(id));
  const masterRef = useRef(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someChecked;
  }, [someChecked]);

  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* master checkbox */}
          {hasProducts ? (
            <input
              ref={masterRef}
              type="checkbox"
              checked={allChecked}
              onChange={(e) => toggleAll(allIds, e.target.checked)}
              className="h-4 w-4"
              title="Select all"
            />
          ) : null}
          <div>
            <div className="font-semibold">
              {type.TYPE}{" "}
              <span className="text-gray-500">({type.TYPE_ID})</span>
            </div>
            <div className="text-xs text-gray-600">
              {productArr?.length || 0} product(s)
              {selectedIds.size ? ` · ${selectedIds.size} selected` : ""}
            </div>
          </div>
        </div>
        <button
          className="rounded-xl px-3 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          disabled={hasProducts}
          onClick={() => onDelete(type.TYPE_ID, hasProducts)}
        >
          Delete
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <InlineEdit
          label="TYPE"
          value={t.TYPE}
          onChange={(v) => setT((s) => ({ ...s, TYPE: v }))}
          onSave={() => save("TYPE")}
        />
        <InlineEdit
          label="DESCRIPTION"
          value={t.DESCRIPTION}
          onChange={(v) => setT((s) => ({ ...s, DESCRIPTION: v }))}
          onSave={() => save("DESCRIPTION")}
        />
        <InlineEdit
          label="RISK"
          value={t.RISK}
          onChange={(v) => setT((s) => ({ ...s, RISK: v }))}
          onSave={() => save("RISK")}
        />
      </div>

      {hasProducts && (
        <div className="mt-3 rounded-lg border border-gray-100">
          <div className="px-3 py-2 text-xs font-semibold text-gray-600">
            Products
          </div>
          <div className="divide-y divide-gray-100">
            {productArr.map((p) => (
              <div
                key={p.PRODUCT_ID}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(p.PRODUCT_ID)}
                    onChange={() => toggleOne(p.PRODUCT_ID)}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.NAME}</div>
                    <div className="text-xs text-gray-600">
                      ID: {p.PRODUCT_ID}
                    </div>
                  </div>
                </div>
                <select
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-black"
                  defaultValue=""
                  onChange={(e) => {
                    const to = e.target.value;
                    if (!to) return;
                    onReassignSingle(p.PRODUCT_ID, to);
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">Reassign to…</option>
                  {types
                    .filter((x) => x?.type?.TYPE_ID !== type.TYPE_ID)
                    .map((x) => (
                      <option key={x.type.TYPE_ID} value={x.type.TYPE_ID}>
                        {x.type.TYPE} ({x.type.TYPE_ID})
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyDetailCard({
  companies,
  item,
  onDelete,
  onUpdateFields,
  onReassignSingle,
  selectedIds,
  toggleOne,
  toggleAll,
}) {
  const { company, productArr } = item || {};
  const hasProducts = (productArr?.length || 0) > 0;

  const [c, setC] = useState({
    NAME: company.NAME ?? "",
    ADDRESS: company.ADDRESS ?? "",
    TYPE: company.TYPE ?? "",
    PHONE: company.PHONE ?? "",
  });
  useEffect(
    () =>
      setC({
        NAME: company.NAME ?? "",
        ADDRESS: company.ADDRESS ?? "",
        TYPE: company.TYPE ?? "",
        PHONE: company.PHONE ?? "",
      }),
    [company]
  );

  const save = (key) =>
    onUpdateFields(company.COMPANY_ID, [{ key, value: c[key] }]);

  const allIds = (productArr || []).map((p) => p.PRODUCT_ID);
  const allChecked = hasProducts && allIds.every((id) => selectedIds.has(id));
  const someChecked =
    hasProducts && !allChecked && allIds.some((id) => selectedIds.has(id));
  const masterRef = useRef(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someChecked;
  }, [someChecked]);

  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* master checkbox */}
          {hasProducts ? (
            <input
              ref={masterRef}
              type="checkbox"
              checked={allChecked}
              onChange={(e) => toggleAll(allIds, e.target.checked)}
              className="h-4 w-4"
              title="Select all"
            />
          ) : null}
          <div>
            <div className="font-semibold">
              {company.NAME}{" "}
              <span className="text-gray-500">({company.COMPANY_ID})</span>
            </div>
            <div className="text-xs text-gray-600">
              {productArr?.length || 0} product(s)
              {selectedIds.size ? ` · ${selectedIds.size} selected` : ""}
            </div>
          </div>
        </div>
        <button
          className="rounded-xl px-3 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          disabled={hasProducts}
          onClick={() => onDelete(company.COMPANY_ID, hasProducts)}
        >
          Delete
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <InlineEdit
          label="NAME"
          value={c.NAME}
          onChange={(v) => setC((s) => ({ ...s, NAME: v }))}
          onSave={() => save("NAME")}
        />
        <InlineEdit
          label="ADDRESS"
          value={c.ADDRESS}
          onChange={(v) => setC((s) => ({ ...s, ADDRESS: v }))}
          onSave={() => save("ADDRESS")}
        />
        <InlineEdit
          label="TYPE (ref)"
          value={c.TYPE}
          onChange={(v) => setC((s) => ({ ...s, TYPE: v }))}
          onSave={() => save("TYPE")}
        />
        <InlineEdit
          label="PHONE"
          value={c.PHONE}
          onChange={(v) => setC((s) => ({ ...s, PHONE: v }))}
          onSave={() => save("PHONE")}
        />
      </div>

      {hasProducts && (
        <div className="mt-3 rounded-lg border border-gray-100">
          <div className="px-3 py-2 text-xs font-semibold text-gray-600">
            Products
          </div>
          <div className="divide-y divide-gray-100">
            {productArr.map((p) => (
              <div
                key={p.PRODUCT_ID}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(p.PRODUCT_ID)}
                    onChange={() => toggleOne(p.PRODUCT_ID)}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.NAME}</div>
                    <div className="text-xs text-gray-600">
                      ID: {p.PRODUCT_ID}
                    </div>
                  </div>
                </div>
                <select
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-black"
                  defaultValue=""
                  onChange={(e) => {
                    const to = e.target.value;
                    if (!to) return;
                    onReassignSingle(p.PRODUCT_ID, to);
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">Reassign to…</option>
                  {companies
                    .filter(
                      (x) => x?.company?.COMPANY_ID !== company.COMPANY_ID
                    )
                    .map((x) => (
                      <option
                        key={x.company.COMPANY_ID}
                        value={x.company.COMPANY_ID}
                      >
                        {x.company.NAME} ({x.company.COMPANY_ID})
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Inline edit ---------- */

function InlineEdit({ label, value, onChange, onSave }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  return (
    <div className="rounded-lg border border-gray-200 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-black outline-none focus:ring-2 focus:ring-gray-900/10"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            onChange?.(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && onSave?.()}
          placeholder={`Edit ${label.toLowerCase()}`}
        />
        <button
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200"
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
