import Tooltip from "@mui/material/Tooltip";
import React, { useEffect, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

const DropdownButton = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(props.data.data);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    props.setData(option);
    setIsOpen(false);
  };

  return (
    <>
      {options.length > 0 && (
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
            id="options-menu"
            aria-haspopup="true"
            aria-expanded={isOpen ? "true" : "false"}
            onClick={handleButtonClick}
          >
            {props.dataValue}
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

          <div
            className={`${
              isOpen ? "block" : "hidden"
            } absolute z-50 mt-1 w-full bg-white shadow-lg`}
            aria-labelledby="options-menu"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <button
                key={option}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                role="menuitem"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default function ViewInventoryModal(props) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [filter, setFilter] = useState([]);

  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL PRODUCTS");

  const [isLoading, setIsLoading] = useState(false);

  const refresh_handler = () => {
    setRefresh(true);
    setTimeout(() => {
      setRefresh(false);
    }, 300);
  };

  const print_handler = async () => {
    setIsLoading(true);
    try {
      let requestData = {};
      const selectedOption = filter.find(
        (item) => item.label === selectedFilter
      );

      if (selectedFilter !== "ALL PRODUCTS") {
        requestData = {
          company: selectedOption.typeID,
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        };
        const pdf = await fetch(
          "http://192.168.1.176:3001/gen_inv_pdf_by_company",
          requestOptions
        );
        const pdfBlob = await pdf.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open(pdfUrl);
        pdfWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        };
        const pdf = await fetch(
          "http://192.168.1.176:3001/gen_inv_pdf_A4",
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

  const init = async () => {
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
      if (productFilterMap.has(data.PRODUCT_ID)) {
        const productLimit = productFilterMap.get(data.PRODUCT_ID);
        if (
          productLimit.MIN_LIMIT != null &&
          productInventory.STORED_STOCK <= productLimit.MIN_LIMIT
        ) {
          return { ...data, focus: false, alert: true, ...productInventory };
        } else {
          return { ...data, focus: false, alert: false, ...productInventory };
        }
      } else {
        return { ...data, focus: false, alert: false, ...productInventory };
      }
    });

    if (selectedFilter !== "ALL PRODUCTS") {
      const filtered_type = filter.filter((item) => {
        return item.label === selectedFilter;
      });
      const filtered_company = formatted_data.filter((item) => {
        return item.COMPANY === filtered_type[0].typeID;
      });
      setInventory(filtered_company);
    } else {
      setInventory(formatted_data);
    }
  };

  const getCompanies = async () => {
    const companies = await http.getPartnerCompanies();
    const initRun1 = companies.data.map((company) => {
      return { label: company.NAME, value: false, typeID: company.COMPANY_ID };
    });
    initRun1.unshift({ label: "ALL PRODUCTS", value: true, typeID: "0" });
    const initRun2 = initRun1.map((item) => {
      return `${item.label}`;
    });

    setFilter(initRun1);
    setFilterOptions(initRun2);
  };

  useEffect(() => {
    getCompanies();
  }, []);

  useEffect(() => {
    setSearchQuery("");
    init();
  }, [selectedFilter]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (refresh) {
      init();
    }
  }, [refresh]);

  useEffect(() => {
    setFilteredInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    if (searchQuery === "") return setFilteredInventory(inventory);
    else {
      const newData = filteredInventory.filter((item) =>
        item.NAME.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInventory(newData);
    }
  }, [searchQuery]);

  const tableRows = filteredInventory.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} ${
        product.alert ? "bg-rose-600" : ""
      }`}
      onClick={() => setSelectedProduct(product)}
    >
      <td className="px-4 py-2 border text-black">{product.PRODUCT_ID}</td>
      <td className="px-4 py-2 border text-black">{product.NAME}</td>
      <Tooltip title="TOTAL STOCK" placement="left" arrow>
        <td className="px-4 py-2 border text-black">
          {product.STOCK ?? "N/A"}
        </td>
      </Tooltip>
      <Tooltip title="Active Stock" placement="left" arrow>
        <td className="px-4 py-2 border text-black">
          {product.ACTIVE_STOCK ?? "N/A"}
        </td>
      </Tooltip>
      <Tooltip title="Stored Stock" placement="left" arrow>
        <td className="px-4 py-2 border text-black">
          {product.STORED_STOCK ?? "N/A"}
        </td>
      </Tooltip>
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
              onClick={() => refresh_handler()}
              className="bg-zuma-login text-white px-4 py-2 rounded-md"
            >
              Refresh
            </button>
            <DropdownButton
              setData={setSelectedFilter}
              dataValue={selectedFilter}
              data={{ data: filterOptions }}
            />
            <button
              onClick={() => (!isLoading ? print_handler() : () => {})}
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
                  <th className="px-4 py-2 border text-black">Product ID</th>
                  <th className="px-4 py-2 border text-black">Name</th>
                  <th className="px-4 py-2 border text-black">Stock</th>
                  <th className="px-4 py-2 border text-black">Active Stock</th>
                  <th className="px-4 py-2 border text-black">Stored Stock</th>
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
