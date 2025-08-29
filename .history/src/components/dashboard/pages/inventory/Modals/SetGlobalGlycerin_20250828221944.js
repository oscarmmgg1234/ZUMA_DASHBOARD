import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

/**
 * SetGlobalGlycerin — Re-themed Settings Hub
 * Sections: Glycerin · Types · Companies
 *
 * Conventions:
 *  - Glycerin: http.getGlobalGlycerin(), http.setGlobalGlycerin({ set_value })
 *  - Types: http.get_typesWithProducts(), http.manage_types({...}), http.update_productType({...}), http.update_typeInfo({...})
 *  - Companies: http.get_companiesWithProducts(), http.manage_companies({...}), http.update_productCompany({...}), http.update_companyInfo({...})
 *
 * Deletion rules:
 *  - Delete disabled if there are still products referencing the type/company.
 * Reassignment:
 *  - Per-product reassignment (row action)
 *  - Bulk reassignment (header action): moves all products referencing that entity to a chosen target.
 */

export default function SetGlobalGlycerin({ visible, closeHandler }) {
  // ---------- section toggles ----------
  const [open, setOpen] = useState({
    glycerin: true,
    types: true,
    companies: true,
  });

  // ---------- GLYCERIN ----------
  const [glyCurrent, setGlyCurrent] = useState(null); // number | null
  const [glyDraft, setGlyDraft] = useState("1");
  const [glyLoading, setGlyLoading] = useState(false);
  const [glySaving, setGlySaving] = useState(false);
  const [glyBanner, setGlyBanner] = useState("");
  const [glyError, setGlyError] = useState("");

  // ---------- TYPES ----------
  const [typesLoading, setTypesLoading] = useState(false);
  const [types, setTypes] = useState([]); // [{ type, productArr }]
  const [typeBanner, setTypeBanner] = useState("");
  const [typeError, setTypeError] = useState("");
  const [newType, setNewType] = useState({
    TYPE_ID: "",
    TYPE: "",
    DESCRIPTION: "",
    RISK: "",
  });
  const [typeBulkTarget, setTypeBulkTarget] = useState(""); // selected TYPE_ID for bulk move

  // ---------- COMPANIES ----------
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companies, setCompanies] = useState([]); // [{ company, productArr }]
  const [companyBanner, setCompanyBanner] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [newCompany, setNewCompany] = useState({
    COMPANY_ID: "",
    NAME: "",
    ADDRESS: "",
    TYPE: "",
    PHONE: "",
  });
  const [companyBulkTarget, setCompanyBulkTarget] = useState(""); // selected COMPANY_ID for bulk move

  // ---------- small UI bits ----------
  const Spinner = () => (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]" />
  );

  const Section = ({ title, open, setOpen, children, subtitle }) => (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="text-gray-400">{open ? "▾" : "▸"}</div>
      </button>
      {open ? <div className="border-t border-gray-100">{children}</div> : null}
    </div>
  );

  // ============================
  // GLYCERIN LOGIC
  // ============================
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

  // ============================
  // TYPES LOGIC
  // ============================
  const loadTypes = async () => {
    setTypesLoading(true);
    setTypeBanner("");
    setTypeError("");
    try {
      const res = await http.get_typesWithProducts();
      setTypes(Array.isArray(res) ? res : []);
    } catch (e) {
      setTypeError(e?.message || "Failed to load types");
    } finally {
      setTypesLoading(false);
    }
  };

  const createType = async () => {
    const { TYPE_ID, TYPE, DESCRIPTION, RISK } = newType;
    if (!TYPE_ID || !TYPE) {
      setTypeError("TYPE_ID and TYPE are required.");
      return;
    }
    try {
      await http.manage_types({
        TYPE_ID,
        TYPE,
        DESCRIPTION,
        RISK,
        option: "create",
      });
      setTypeBanner(`Created type ${TYPE} (${TYPE_ID})`);
      setNewType({ TYPE_ID: "", TYPE: "", DESCRIPTION: "", RISK: "" });
      await loadTypes();
    } catch (e) {
      setTypeError(e?.message || "Failed to create type");
    }
  };

  const deleteType = async (TYPE_ID, hasProducts) => {
    if (hasProducts) return; // guarded
    try {
      await http.manage_types({ TYPE_ID, option: "delete" });
      setTypeBanner(`Deleted type ${TYPE_ID}`);
      await loadTypes();
    } catch (e) {
      setTypeError(e?.message || "Failed to delete type");
    }
  };

  const renameOrEditType = async (TYPE_ID, changes) => {
    // changes: [{ key: 'TYPE'|'DESCRIPTION'|'RISK', value: string}, ...]
    try {
      await http.update_typeInfo({ typeID: TYPE_ID, changes });
      setTypeBanner(`Type ${TYPE_ID} updated`);
      await loadTypes();
    } catch (e) {
      setTypeError(e?.message || "Failed to update type");
    }
  };

  const reassignProductType = async (PRODUCT_ID, toTYPE_ID) => {
    try {
      await http.update_productType({
        productID: PRODUCT_ID,
        typeID: toTYPE_ID,
        option: "single",
      });
      await loadTypes();
      setTypeBanner(`Reassigned product ${PRODUCT_ID} → ${toTYPE_ID}`);
    } catch (e) {
      setTypeError(e?.message || "Failed to reassign product type");
    }
  };

  const bulkReassignType = async (fromTYPE_ID, toTYPE_ID) => {
    if (!toTYPE_ID || toTYPE_ID === fromTYPE_ID) return;
    // iterate products referencing fromTYPE_ID and move one by one
    try {
      const src = types.find((t) => t?.type?.TYPE_ID === fromTYPE_ID);
      const list = src?.productArr || [];
      for (const p of list) {
        // single reassign
        await http.update_productType({
          productID: p.PRODUCT_ID,
          typeID: toTYPE_ID,
          option: "single",
        });
      }
      setTypeBanner(
        `Moved ${list.length} product(s) from ${fromTYPE_ID} → ${toTYPE_ID}`
      );
      await loadTypes();
    } catch (e) {
      setTypeError(e?.message || "Bulk move failed");
    }
  };

  // ============================
  // COMPANIES LOGIC
  // ============================
  const loadCompanies = async () => {
    setCompaniesLoading(true);
    setCompanyBanner("");
    setCompanyError("");
    try {
      const res = await http.get_companiesWithProducts();
      setCompanies(Array.isArray(res) ? res : []);
    } catch (e) {
      setCompanyError(e?.message || "Failed to load companies");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const createCompany = async () => {
    const { COMPANY_ID, NAME, ADDRESS, TYPE, PHONE } = newCompany;
    if (!COMPANY_ID || !NAME) {
      setCompanyError("COMPANY_ID and NAME are required.");
      return;
    }
    try {
      await http.manage_companies({
        COMPANY_ID,
        NAME,
        ADDRESS,
        TYPE,
        PHONE,
        option: "create",
      });
      setCompanyBanner(`Created company ${NAME} (${COMPANY_ID})`);
      setNewCompany({
        COMPANY_ID: "",
        NAME: "",
        ADDRESS: "",
        TYPE: "",
        PHONE: "",
      });
      await loadCompanies();
    } catch (e) {
      setCompanyError(e?.message || "Failed to create company");
    }
  };

  const deleteCompany = async (COMPANY_ID, hasProducts) => {
    if (hasProducts) return; // guarded
    try {
      await http.manage_companies({ COMPANY_ID, option: "delete" });
      setCompanyBanner(`Deleted company ${COMPANY_ID}`);
      await loadCompanies();
    } catch (e) {
      setCompanyError(e?.message || "Failed to delete company");
    }
  };

  const editCompany = async (COMPANY_ID, changes) => {
    try {
      await http.update_companyInfo({ companyID: COMPANY_ID, changes });
      setCompanyBanner(`Company ${COMPANY_ID} updated`);
      await loadCompanies();
    } catch (e) {
      setCompanyError(e?.message || "Failed to update company");
    }
  };

  const reassignProductCompany = async (PRODUCT_ID, toCOMPANY_ID) => {
    try {
      await http.update_productCompany({
        productID: PRODUCT_ID,
        companyID: toCOMPANY_ID,
        option: "single",
      });
      await loadCompanies();
      setCompanyBanner(`Reassigned product ${PRODUCT_ID} → ${toCOMPANY_ID}`);
    } catch (e) {
      setCompanyError(e?.message || "Failed to reassign product company");
    }
  };

  const bulkReassignCompany = async (fromCOMPANY_ID, toCOMPANY_ID) => {
    if (!toCOMPANY_ID || toCOMPANY_ID === fromCOMPANY_ID) return;
    try {
      const src = companies.find(
        (c) => c?.company?.COMPANY_ID === fromCOMPANY_ID
      );
      const list = src?.productArr || [];
      for (const p of list) {
        await http.update_productCompany({
          productID: p.PRODUCT_ID,
          companyID: toCOMPANY_ID,
          option: "single",
        });
      }
      setCompanyBanner(
        `Moved ${list.length} product(s) from ${fromCOMPANY_ID} → ${toCOMPANY_ID}`
      );
      await loadCompanies();
    } catch (e) {
      setCompanyError(e?.message || "Bulk move failed");
    }
  };

  // ============================
  // LIFECYCLE
  // ============================
  useEffect(() => {
    if (!visible) return;
    // load all three in parallel
    loadGlycerin();
    loadTypes();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ============================
  // RENDER
  // ============================
  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title="System Settings"
      closeName="Settings"
    >
      <div className="space-y-4 p-4">
        {/* ===== GLYCERIN ===== */}
        <Section
          title="Glycerin Configuration"
          subtitle="Manage the global glycerin unit used across calculations."
          open={open.glycerin}
          setOpen={(v) => setOpen((s) => ({ ...s, glycerin: v }))}
        >
          <div className="p-4">
            {glyBanner ? (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {glyBanner}
              </div>
            ) : null}
            {glyError ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {glyError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Current Unit
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {glyLoading ? (
                    <Spinner />
                  ) : glyCurrent != null ? (
                    glyCurrent
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  New Unit
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
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
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/20"
                    placeholder="Enter new glycerin unit"
                  />
                  <button
                    className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    onClick={() =>
                      glyCurrent != null && setGlyDraft(String(glyCurrent))
                    }
                  >
                    Reset
                  </button>
                  <button
                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    onClick={saveGlycerin}
                    disabled={!glyCanSave}
                  >
                    {glySaving ? (
                      <>
                        <Spinner /> <span className="ml-1">Updating</span>
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Must be a positive number. Zero and unchanged values are not
                  allowed.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ===== TYPES ===== */}
        <Section
          title="Product Types"
          subtitle="Create, edit, and reassign product types."
          open={open.types}
          setOpen={(v) => setOpen((s) => ({ ...s, types: v }))}
        >
          <div className="p-4 space-y-4">
            {typeBanner ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {typeBanner}
              </div>
            ) : null}
            {typeError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {typeError}
              </div>
            ) : null}

            {/* Create Type */}
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-xs font-semibold uppercase text-gray-500">
                Create Type
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <input
                  className="input"
                  placeholder="TYPE_ID *"
                  value={newType.TYPE_ID}
                  onChange={(e) =>
                    setNewType((s) => ({ ...s, TYPE_ID: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="TYPE *"
                  value={newType.TYPE}
                  onChange={(e) =>
                    setNewType((s) => ({ ...s, TYPE: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="DESCRIPTION"
                  value={newType.DESCRIPTION}
                  onChange={(e) =>
                    setNewType((s) => ({ ...s, DESCRIPTION: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="RISK"
                    value={newType.RISK}
                    onChange={(e) =>
                      setNewType((s) => ({ ...s, RISK: e.target.value }))
                    }
                  />
                  <button className="btn-primary" onClick={createType}>
                    Create
                  </button>
                </div>
              </div>
            </div>

            {/* Types List */}
            <div className="rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold uppercase text-gray-500">
                  All Types
                </div>
                <div className="text-xs text-gray-500">
                  {typesLoading ? <Spinner /> : `${types.length} total`}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {types.map(({ type, productArr }) => {
                  const count = productArr?.length || 0;
                  const hasProducts = count > 0;

                  // local edits (TYPE / DESCRIPTION / RISK)
                  const [editType, setEditType] = [
                    type.TYPE,
                    (v) =>
                      renameOrEditType(type.TYPE_ID, [
                        { key: "TYPE", value: v },
                      ]),
                  ];
                  const [editDesc, setEditDesc] = [
                    type.DESCRIPTION ?? "",
                    (v) =>
                      renameOrEditType(type.TYPE_ID, [
                        { key: "DESCRIPTION", value: v },
                      ]),
                  ];
                  const [editRisk, setEditRisk] = [
                    type.RISK ?? "",
                    (v) =>
                      renameOrEditType(type.TYPE_ID, [
                        { key: "RISK", value: v },
                      ]),
                  ];

                  return (
                    <div key={type.TYPE_ID} className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {type.TYPE}{" "}
                            <span className="text-gray-400">
                              ({type.TYPE_ID})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {count} product{count !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={typeBulkTarget}
                            onChange={(e) => setTypeBulkTarget(e.target.value)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="">Bulk move to…</option>
                            {types
                              .filter((t) => t?.type?.TYPE_ID !== type.TYPE_ID)
                              .map((t) => (
                                <option
                                  key={t.type.TYPE_ID}
                                  value={t.type.TYPE_ID}
                                >
                                  {t.type.TYPE} ({t.type.TYPE_ID})
                                </option>
                              ))}
                          </select>
                          <button
                            className="btn-secondary disabled:opacity-50"
                            onClick={() =>
                              bulkReassignType(type.TYPE_ID, typeBulkTarget)
                            }
                            disabled={
                              !hasProducts ||
                              !typeBulkTarget ||
                              typeBulkTarget === type.TYPE_ID
                            }
                          >
                            {hasProducts ? "Bulk Move" : "No Products"}
                          </button>
                          <button
                            className="btn-danger disabled:opacity-50"
                            onClick={() =>
                              deleteType(type.TYPE_ID, hasProducts)
                            }
                            disabled={hasProducts}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* inline edit + per-product reassignment */}
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <InlineEdit
                          label="TYPE"
                          value={type.TYPE}
                          onSave={(v) => setTimeout(() => editType(v), 0)}
                        />
                        <InlineEdit
                          label="DESCRIPTION"
                          value={type.DESCRIPTION ?? ""}
                          onSave={(v) => setTimeout(() => editDesc(v), 0)}
                        />
                        <InlineEdit
                          label="RISK"
                          value={type.RISK ?? ""}
                          onSave={(v) => setTimeout(() => editRisk(v), 0)}
                        />
                      </div>

                      {hasProducts ? (
                        <div className="mt-3 rounded-lg border border-gray-100">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500">
                            Products
                          </div>
                          <div className="divide-y divide-gray-100">
                            {productArr.map((p) => (
                              <div
                                key={p.PRODUCT_ID}
                                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {p.PRODUCT_NAME}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {p.PRODUCT_ID}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                                    defaultValue=""
                                    onChange={(e) => {
                                      const to = e.target.value;
                                      if (to)
                                        reassignProductType(p.PRODUCT_ID, to);
                                    }}
                                  >
                                    <option value="">Reassign to…</option>
                                    {types
                                      .filter(
                                        (t) => t?.type?.TYPE_ID !== type.TYPE_ID
                                      )
                                      .map((t) => (
                                        <option
                                          key={t.type.TYPE_ID}
                                          value={t.type.TYPE_ID}
                                        >
                                          {t.type.TYPE} ({t.type.TYPE_ID})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {(!types || types.length === 0) && !typesLoading ? (
                  <div className="p-4 text-sm text-gray-500">
                    No types yet. Create one above.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Section>

        {/* ===== COMPANIES ===== */}
        <Section
          title="Companies"
          subtitle="Create, edit, and reassign product companies."
          open={open.companies}
          setOpen={(v) => setOpen((s) => ({ ...s, companies: v }))}
        >
          <div className="p-4 space-y-4">
            {companyBanner ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {companyBanner}
              </div>
            ) : null}
            {companyError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {companyError}
              </div>
            ) : null}

            {/* Create Company */}
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-xs font-semibold uppercase text-gray-500">
                Create Company
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                <input
                  className="input"
                  placeholder="COMPANY_ID *"
                  value={newCompany.COMPANY_ID}
                  onChange={(e) =>
                    setNewCompany((s) => ({ ...s, COMPANY_ID: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="NAME *"
                  value={newCompany.NAME}
                  onChange={(e) =>
                    setNewCompany((s) => ({ ...s, NAME: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="ADDRESS"
                  value={newCompany.ADDRESS}
                  onChange={(e) =>
                    setNewCompany((s) => ({ ...s, ADDRESS: e.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="TYPE (ref)"
                  value={newCompany.TYPE}
                  onChange={(e) =>
                    setNewCompany((s) => ({ ...s, TYPE: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="PHONE"
                    value={newCompany.PHONE}
                    onChange={(e) =>
                      setNewCompany((s) => ({ ...s, PHONE: e.target.value }))
                    }
                  />
                  <button className="btn-primary" onClick={createCompany}>
                    Create
                  </button>
                </div>
              </div>
            </div>

            {/* Companies List */}
            <div className="rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-semibold uppercase text-gray-500">
                  All Companies
                </div>
                <div className="text-xs text-gray-500">
                  {companiesLoading ? <Spinner /> : `${companies.length} total`}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {companies.map(({ company, productArr }) => {
                  const count = productArr?.length || 0;
                  const hasProducts = count > 0;

                  const updateCompanyField = (key, value) =>
                    editCompany(company.COMPANY_ID, [{ key, value }]);

                  return (
                    <div key={company.COMPANY_ID} className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {company.NAME}{" "}
                            <span className="text-gray-400">
                              ({company.COMPANY_ID})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {count} product{count !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={companyBulkTarget}
                            onChange={(e) =>
                              setCompanyBulkTarget(e.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="">Bulk move to…</option>
                            {companies
                              .filter(
                                (c) =>
                                  c?.company?.COMPANY_ID !== company.COMPANY_ID
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
                            className="btn-secondary disabled:opacity-50"
                            onClick={() =>
                              bulkReassignCompany(
                                company.COMPANY_ID,
                                companyBulkTarget
                              )
                            }
                            disabled={
                              !hasProducts ||
                              !companyBulkTarget ||
                              companyBulkTarget === company.COMPANY_ID
                            }
                          >
                            {hasProducts ? "Bulk Move" : "No Products"}
                          </button>
                          <button
                            className="btn-danger disabled:opacity-50"
                            onClick={() =>
                              deleteCompany(company.COMPANY_ID, hasProducts)
                            }
                            disabled={hasProducts}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <InlineEdit
                          label="NAME"
                          value={company.NAME}
                          onSave={(v) => updateCompanyField("NAME", v)}
                        />
                        <InlineEdit
                          label="ADDRESS"
                          value={company.ADDRESS ?? ""}
                          onSave={(v) => updateCompanyField("ADDRESS", v)}
                        />
                        <InlineEdit
                          label="TYPE (ref)"
                          value={company.TYPE ?? ""}
                          onSave={(v) => updateCompanyField("TYPE", v)}
                        />
                        <InlineEdit
                          label="PHONE"
                          value={company.PHONE ?? ""}
                          onSave={(v) => updateCompanyField("PHONE", v)}
                        />
                      </div>

                      {hasProducts ? (
                        <div className="mt-3 rounded-lg border border-gray-100">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500">
                            Products
                          </div>
                          <div className="divide-y divide-gray-100">
                            {productArr.map((p) => (
                              <div
                                key={p.PRODUCT_ID}
                                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {p.PRODUCT_NAME}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {p.PRODUCT_ID}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                                    defaultValue=""
                                    onChange={(e) => {
                                      const to = e.target.value;
                                      if (to)
                                        reassignProductCompany(
                                          p.PRODUCT_ID,
                                          to
                                        );
                                    }}
                                  >
                                    <option value="">Reassign to…</option>
                                    {companies
                                      .filter(
                                        (c) =>
                                          c?.company?.COMPANY_ID !==
                                          company.COMPANY_ID
                                      )
                                      .map((c) => (
                                        <option
                                          key={c.company.COMPANY_ID}
                                          value={c.company.COMPANY_ID}
                                        >
                                          {c.company.NAME} (
                                          {c.company.COMPANY_ID})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {(!companies || companies.length === 0) && !companiesLoading ? (
                  <div className="p-4 text-sm text-gray-500">
                    No companies yet. Create one above.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </BaseModal>
  );
}

/* ---------- tiny styled inputs/buttons via Tailwind ---------- */
function InlineEdit({ label, value, onSave }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);

  return (
    <div className="rounded-lg border border-gray-200 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/10"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave?.(v)}
          placeholder={`Edit ${label.toLowerCase()}`}
        />
        <button className="btn-light" onClick={() => onSave?.(v)}>
          Save
        </button>
      </div>
    </div>
  );
}

/* Tailwind utility classes used:
   - .input = rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/10
   - .btn-primary = rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800
   - .btn-secondary = rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200
   - .btn-danger = rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700
   - .btn-light = rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50
*/
