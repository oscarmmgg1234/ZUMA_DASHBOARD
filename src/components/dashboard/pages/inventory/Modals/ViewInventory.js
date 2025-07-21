import Tooltip from "@mui/material/Tooltip";
import React, { useEffect, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

const DropdownButton = ({ setData, dataValue, data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (option) => {
    setData(option);
    setIsOpen(false);
  };

  useEffect(() => {
    // Optional: close dropdown on outside click
    const handleOutsideClick = (e) => {
      if (!e.target.closest("#dropdown-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div
      id="dropdown-container"
      className="relative inline-block text-left z-50"
    >
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        {dataValue}
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 011.414 0l.707.707a1 1 0 010 1.414L11.414 10l2.293 2.293a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414 0L10 11.414l-2.293 2.293a1 1 0 01-1.414 0l-.707-.707z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {data.data.map((option, idx) => (
            <button
              key={`${option}-${idx}`}
              onClick={() => handleOptionClick(option)}
              className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                option === dataValue ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ViewInventoryModal(props) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [filter, setFilter] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL PRODUCTS");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL TYPES");
  const [filterOptions, setFilterOptions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [sortOrder, setSortOrder] = useState("ASC");
  const [isLoading, setIsLoading] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printFilter, setPrintFilter] = useState({
    company: selectedFilter,
    type: selectedTypeFilter,
    sort: sortOrder,
  });

  const print_handler = async (printFilter) => {
    setIsLoading(true);
    try {
      let requestData = {};
      const selectedCompany = filter.find(
        (item) => item.label === printFilter.company
      );
      const selectedType = productTypes.find(
        (item) => item.label === printFilter.type
      );

      if (selectedCompany.label !== "ALL PRODUCTS" && selectedType) {
        requestData = {
          company: selectedCompany.typeID,
          type: selectedType.id,
          sortOrder: printFilter.sort,
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        };
        const pdf = await fetch(
          "http://192.168.1.247:3001/genPdfSpecific",
          requestOptions
        );
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        pdfWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
      } else if(selectedCompany.label !== "ALL PRODUCTS" && !selectedType?.id) {
        requestData = {
          company: {company: selectedCompany.typeID, sortOrder: printFilter.sort}
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        };
        const pdf = await fetch(
          "http://192.168.1.247:3001/gen_inv_pdf_by_company",
          requestOptions
        );
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        pdfWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
      }
      else{
         requestData = {
           company: {
             company: selectedCompany.typeID,
             sortOrder: printFilter.sort,
           },
         };
         const requestOptions = {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify(requestData),
         };
         const pdf = await fetch(
           "http://192.168.1.247:3001/gen_inv_pdf_A4",
           requestOptions
         );
         const pdfBlob = await pdf.blob();
         const pdfUrl = URL.createObjectURL(pdfBlob);
         const pdfWindow = window.open(pdfUrl);
         pdfWindow.onload = () => {
           URL.revokeObjectURL(pdfUrl);
         };
      }
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  const getCompanies = async () => {
    const companies = await http.getPartnerCompanies();
    const companyOptions = companies.data.map((company) => ({
      label: company.NAME,
      value: false,
      typeID: company.COMPANY_ID,
    }));
    companyOptions.unshift({ label: "ALL PRODUCTS", value: true, typeID: "0" });

    setFilter(companyOptions);
    setFilterOptions(companyOptions.map((item) => item.label));
  };
  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  const sortAndFilterInventory = (
    query,
    data,
    companyFilter,
    typeFilter,
    order
  ) => {
    let filtered = [...data];

    // Company filter
    if (companyFilter !== "ALL PRODUCTS") {
      const selectedOption = filter.find(
        (item) => item.label === companyFilter
      );
      if (selectedOption) {
        filtered = filtered.filter(
          (item) => item.COMPANY === selectedOption.typeID
        );
      }
    }

    // Type filter
    if (typeFilter !== "ALL TYPES") {
      const selectedType = productTypes.find(
        (item) => item.label === typeFilter
      );
      if (selectedType) {
        filtered = filtered.filter((item) => item.TYPE === selectedType.id);
      }
    }

    // Search filter
    if (query !== "") {
      filtered = filtered.filter((item) =>
        item.NAME.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (order === "ASC") return a.NAME.localeCompare(b.NAME);
      else return b.NAME.localeCompare(a.NAME);
    });

    setFilteredInventory(filtered);
  };

  useEffect(() => {
    sortAndFilterInventory(
      searchQuery,
      inventory,
      selectedFilter,
      selectedTypeFilter,
      sortOrder
    );
  }, [searchQuery, inventory, selectedFilter, selectedTypeFilter, sortOrder]);

  const refresh_handler = () => {
    setRefresh(true);
    setTimeout(() => {
      setRefresh(false);
    }, 300);
  };

  const init = async () => {
    await getCompanies();
    const productTypes = await http.getProductTypes();
    const types = productTypes.data.map((type) => ({
      id: type.TYPE_ID,
      label: type.TYPE,
    }));
    setProductTypes(types);
    setSelectedTypeFilter("ALL TYPES");

    let metric_map = new Map();
    const metrics = await http.getGlobalMetrics();
    metrics.perHourMonthTimeFrame.forEach((item) => {
      const rate = parseFloat(item.total);
      metric_map.set(item.product_id, rate > 0 ? rate : 0);
    });
    setMetrics(metric_map);

    const productInventory = await http.getProductsInventory();
    const inventoryMap = new Map(
      productInventory.data.map((item) => [item.PRODUCT_ID, item])
    );
    const products = await http.getProducts();
    const productFilterMap = new Map(
      products.data.map((product) => [product.PRODUCT_ID, product])
    );

    const formatted_data = products.data.map((data) => {
      const productInventory = inventoryMap.get(data.PRODUCT_ID);
      const productLimit = productFilterMap.get(data.PRODUCT_ID);
      const isBelowLimit =
        productLimit?.MIN_LIMIT != null &&
        productInventory?.STORED_STOCK <= productLimit.MIN_LIMIT;

      return {
        ...data,
        focus: false,
        alert: isBelowLimit,
        ...productInventory,
      };
    });

    setInventory(formatted_data);
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (refresh) {
      init();
    }
  }, [refresh]);

  const tableRows = filteredInventory.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} ${
        product.alert ? "bg-rose-300" : ""
      }`}
      onClick={() => setSelectedProduct(product)}
    >
      <td className="px-4 py-2 border text-black ">{product.NAME}</td>
      <Tooltip title="TOTAL STOCK" placement="left" arrow>
        <td className="px-4 py-2 text-black font-bold bg-gray-500/30">
          {Math.round(product.STOCK) ?? "N/A"}
        </td>
      </Tooltip>
      <Tooltip title="Active Stock" placement="left" arrow>
        <td className="px-4 py-2 border text-black">
          {Math.round(product.ACTIVE_STOCK) ?? "N/A"}
        </td>
      </Tooltip>
      <Tooltip title="Stored Stock" placement="left" arrow>
        <td className="px-4 py-2 border text-black">
          {Math.round(product.STORED_STOCK) ?? "N/A"}
        </td>
      </Tooltip>
      <td className="px-4 py-2 border text-black">
        {metrics.get(product.PRODUCT_ID) === 0
          ? "N/A"
          : metrics.get(product.PRODUCT_ID)}
      </td>
    </tr>
  ));

  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"View Inventory"}
        closeName={"viewInv"}
      >
        <div className="container mx-auto p-4 flex flex-col h-full">
          <div className="flex justify-between mb-3">
            <button
              onClick={refresh_handler}
              className="bg-zuma-login text-white px-4 py-2 rounded-md"
            >
              Refresh
            </button>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-black">Company:</label>
              <DropdownButton
                setData={setSelectedFilter}
                dataValue={selectedFilter}
                data={{ data: filterOptions }}
              />
              <label className="text-sm text-black">Type:</label>
              <DropdownButton
                setData={setSelectedTypeFilter}
                dataValue={selectedTypeFilter}
                data={{
                  data: ["ALL TYPES", ...productTypes.map((t) => t.label)],
                }}
              />
              <div className="flex items-center space-x-2">
                <label className="text-sm text-black">Sort:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm text-black w-20"
                >
                  <option value="ASC">A-Z</option>
                  <option value="DESC">Z-A</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setPrintModalOpen(true)}
              className="bg-zuma-login text-white px-4 py-2 rounded-md"
            >
              Print
            </button>
          </div>
          {isLoading && <h1 className="text-black">Generating PDF...</h1>}
          <div className="h-[72vh] overflow-y-auto">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-4 p-2 border rounded-lg text-black sticky top-0 bg-white"
              placeholder="Search..."
            />
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-300">
                  <th className="px-4 py-2 border text-black">Product</th>
                  <th className="px-4 py-2 border text-black">Total Stock</th>
                  <th className="px-4 py-2 border text-black">Active Stock</th>
                  <th className="px-4 py-2 border text-black">Stored Stock</th>
                  <th className="px-4 py-2 border text-black">
                    Todays Reductions Rate (hour/day)
                  </th>
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </div>
        </div>
        {printModalOpen && (
          <div className="fixed inset-0 flex justify-center items-start pt-20 z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
              <h2 className="text-lg font-bold mb-4 text-black">
                Confirm Print
              </h2>

              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm text-black mb-1">
                    Company:
                  </label>
                  <DropdownButton
                    setData={(val) =>
                      setPrintFilter((prev) => ({ ...prev, company: val }))
                    }
                    dataValue={printFilter.company}
                    data={{ data: filterOptions }}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm text-black mb-1">Type:</label>
                  <DropdownButton
                    setData={(val) =>
                      setPrintFilter((prev) => ({ ...prev, type: val }))
                    }
                    dataValue={printFilter.type}
                    data={{
                      data: ["ALL TYPES", ...productTypes.map((t) => t.label)],
                    }}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-[120px]">
                  <label className="block text-sm text-black mb-1">Sort:</label>
                  <select
                    value={printFilter.sort}
                    onChange={(e) =>
                      setPrintFilter((prev) => ({
                        ...prev,
                        sort: e.target.value,
                      }))
                    }
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm text-black w-full"
                  >
                    <option value="ASC">A-Z</option>
                    <option value="DESC">Z-A</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setPrintModalOpen(false);

                    await print_handler(printFilter); // Pass company to handler
                  }}
                  className="bg-zuma-login text-white px-4 py-2 rounded"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-white border-opacity-70"></div>
              <p className="text-white font-semibold text-lg">
                Generating PDF...
              </p>
            </div>
          </div>
        )}
      </BaseModal>
    </>
  );
}
