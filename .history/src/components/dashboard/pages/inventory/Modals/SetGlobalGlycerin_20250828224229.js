import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();
const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]" />
);
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

  // constant per your note
  const GALLON_ML = 3785.41; // used for the hint preview

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
  const [typeCreating, setTypeCreating] = useState(false); // NEW

  const loadTypes = async () => {
    setTypesLoading(true);
    setTypesMsg({ ok: "", err: "" });
    try {
      const res = await http.get_typesWithProducts();
      setTypes(Array.isArray(res) ? res : []);
      if (Array.isArray(res) && res.length > 0) {
        setSelectedTypeID(res[0].type.TYPE_ID); // default to first
      } else {
        setSelectedTypeID("");
      }
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
    setTypeCreating(true); // NEW
    try {
      await http.manage_types({ ...payload, option: "create" });
      setTypesMsg({
        ok: `Created type ${payload.TYPE} (${payload.TYPE_ID})`,
        err: "",
      });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to create type" });
    } finally {
      setTypeCreating(false); // NEW
    }
  };

  const deleteType = async (TYPE_ID, hasProducts) => {
    if (hasProducts) return;
    try {
      await http.manage_types({ TYPE_ID, option: "delete" });
      setTypesMsg({ ok: `Deleted type ${TYPE_ID}`, err: "" });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to delete type" });
    }
  };

  const updateTypeFields = async (TYPE_ID, changes) => {
    try {
      await http.update_typeInfo({ typeID: TYPE_ID, changes });
      setTypesMsg({ ok: `Updated type ${TYPE_ID}`, err: "" });
      await loadTypes();
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to update type" });
    }
  };

  const reassignTypeSingle = async (PRODUCT_ID, toTYPE_ID) => {
    try {
      await http.update_productType({
        productID: PRODUCT_ID,
        typeID: toTYPE_ID,
        option: "single",
      });
      await loadTypes();
      setTypesMsg({
        ok: `Moved product ${PRODUCT_ID} → ${toTYPE_ID}`,
        err: "",
      });
    } catch (e) {
      setTypesMsg({ ok: "", err: e?.message || "Failed to move product" });
    }
  };

  // ========== COMPANIES ==========
  const [companies, setCompanies] = useState([]); // [{company, productArr}]
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesMsg, setCompaniesMsg] = useState({ ok: "", err: "" });
  const [companyFilter, setCompanyFilter] = useState("");
  const [selectedCompanyID, setSelectedCompanyID] = useState("");
  const [companyCreating, setCompanyCreating] = useState(false); // NEW

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    setCompaniesMsg({ ok: "", err: "" });
    try {
      const res = await http.get_companiesWithProducts();
      setCompanies(Array.isArray(res) ? res : []);
      if (Array.isArray(res) && res.length > 0) {
        setSelectedCompanyID(res[0].company.COMPANY_ID); // default to first
      } else {
        setSelectedCompanyID("");
      }
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
    setCompanyCreating(true); // NEW
    try {
      await http.manage_companies({ ...payload, option: "create" });
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
      setCompanyCreating(false); // NEW
    }
  };

  const deleteCompany = async (COMPANY_ID, hasProducts) => {
    if (hasProducts) return;
    try {
      await http.manage_companies({ COMPANY_ID, option: "delete" });
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
      await http.update_companyInfo({ companyID: COMPANY_ID, changes });
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
      await http.update_productCompany({
        productID: PRODUCT_ID,
        companyID: toCOMPANY_ID,
        option: "single",
      });
      await loadCompanies();
      setCompaniesMsg({
        ok: `Moved product ${PRODUCT_ID} → ${toCOMPANY_ID}`,
        err: "",
      });
    } catch (e) {
      setCompaniesMsg({ ok: "", err: e?.message || "Failed to move product" });
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

  const Spinner = () => (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]" />
  );

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title="System T"
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
                {/* NEW: the hint you asked for */}
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
          subtitle="Create, edit, and reassign product types."
          open={open.types}
          onToggle={() => setOpen((s) => ({ ...s, types: !s.types }))}
        >
          <TypesPanel
            types={types}
            typesLoading={typesLoading}
            typesMsg={typesMsg}
            selectedTypeID={selectedTypeID}
            setSelectedTypeID={setSelectedTypeID}
            filteredTypes={filteredTypes}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            selectedType={selectedType}
            createType={createType}
            deleteType={deleteType}
            updateTypeFields={updateTypeFields}
            reassignTypeSingle={reassignTypeSingle}
            typeCreating={typeCreating} // NEW
          />
        </Card>

        {/* Companies */}
        <Card
          title="Companies"
          subtitle="Create, edit, and reassign product companies."
          open={open.companies}
          onToggle={() => setOpen((s) => ({ ...s, companies: !s.companies }))}
        >
          <CompaniesPanel
            companies={companies}
            companiesLoading={companiesLoading}
            companiesMsg={companiesMsg}
            selectedCompanyID={selectedCompanyID}
            setSelectedCompanyID={setSelectedCompanyID}
            filteredCompanies={filteredCompanies}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            selectedCompany={selectedCompany}
            createCompany={createCompany}
            deleteCompany={deleteCompany}
            updateCompanyFields={updateCompanyFields}
            reassignCompanySingle={reassignCompanySingle}
            companyCreating={companyCreating} // NEW
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
  deleteType,
  updateTypeFields,
  reassignTypeSingle,
  typeCreating,
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
        <CreateTypeRow onCreate={createType} creating={typeCreating} />{" "}
        {/* NEW */}
      </div>

      {/* Selector + details */}
      <div className="flex items-center gap-2">
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
        <span className="text-xs text-gray-600">
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
  deleteCompany,
  updateCompanyFields,
  reassignCompanySingle,
  companyCreating,
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
        <CreateCompanyRow onCreate={createCompany} creating={companyCreating} />{" "}
        {/* NEW */}
      </div>

      {/* Selector + details */}
      <div className="flex items-center gap-2">
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
        <span className="text-xs text-gray-600">
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

// Create Type: compact row with loading/notification
function CreateTypeRow({ onCreate, creating }) {
  const [draft, setDraft] = useState({
    TYPE_ID: "",
    TYPE: "",
    DESCRIPTION: "",
    RISK: "",
  });
  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="text-xs font-semibold uppercase text-gray-600">
        Create Type
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-4">
        <input
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="TYPE_ID *"
          value={draft.TYPE_ID}
          onChange={(e) => setDraft((s) => ({ ...s, TYPE_ID: e.target.value }))}
        />
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

// Create Company: compact row with loading/notification
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

// Detail card for a single Type
function TypeDetailCard({
  types,
  item,
  onDelete,
  onUpdateFields,
  onReassignSingle,
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

  const save = (key) => {
    const changes = [{ key, value: t[key] }];
    onUpdateFields(type.TYPE_ID, changes);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">
            {type.TYPE} <span className="text-gray-500">({type.TYPE_ID})</span>
          </div>
          <div className="text-xs text-gray-600">
            {productArr?.length || 0} product(s)
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
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.NAME}</div>
                  <div className="text-xs text-gray-600">
                    ID: {p.PRODUCT_ID}
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

// Detail card for a single Company
function CompanyDetailCard({
  companies,
  item,
  onDelete,
  onUpdateFields,
  onReassignSingle,
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

  return (
    <div className="rounded-xl border border-gray-200 p-3 text-black">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">
            {company.NAME}{" "}
            <span className="text-gray-500">({company.COMPANY_ID})</span>
          </div>
          <div className="text-xs text-gray-600">
            {productArr?.length || 0} product(s)
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
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.NAME}</div>
                  <div className="text-xs text-gray-600">
                    ID: {p.PRODUCT_ID}
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

// inline edit control
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
