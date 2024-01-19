import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import PieChart from "./Chart";

const http = new http_handler();

const DropdownButton = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(props.data.data);

  // useEffect(() => {
  //   if (data) {
  //     setOptions(data);
  //   }
  // }, [data]);

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
                d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 011.414 0l.707.707a1 1 0 010 1.414L11.414 10l2.293 2.293a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414 0L10 11.414l-2.293 2.293a1 1 0 01-1.414 0l-.707-.707a1 1 0 010-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414l.707-.707z"
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
  const [filter, setFilter] = useState([
    { label: "ALL PRODUCTS", value: true, typeID: "0" },
    { label: "Kukista", value: false, typeID: "199" },
    { label: "Mirron Glass", value: false, typeID: "222" },
    { label: "Swanson", value: false, typeID: "225" },
    { label: "Papermart", value: false, typeID: "233" },
    { label: "Jarrow", value: false, typeID: "321" },
    { label: "Healthy Origins", value: false, typeID: "344" },
    { label: "Atlas", value: false, typeID: "3892" },
    { label: "Wizard Label", value: false, typeID: "433" },
    { label: "Essential Wholesale", value: false, typeID: "4920" },
    { label: "Montiff", value: false, typeID: "7320" },
    { label: "Omica", value: false, typeID: "888" },
    { label: "Ecological", value: false, typeID: "992" },
    { label: "Bumble Mailers", value: false, typeID: "1903" },
  ]);

  const [filterOptions, setFilterOptions] = useState([
    "ALL PRODUCTS",
    "Kukista",
    "Mirron Glass",
    "Swanson",
    "Papermart",
    "Jarrow",
    "Healthy Origins",
    "Atlas",
    "Wizard Label",
    "Essential Wholesale",
    "Montiff",
    "Omica",
    "Ecological",
    "Bumble Mailers",
  ]);

  const [selectedFilter, setSelectedFilter] = useState("ALL PRODUCTS");

  const [productAnalytics, setProductAnalytics] = useState(null);

  const refresh_handler = () => {
    setRefresh(true);
    setTimeout(() => {
      setRefresh(false);
    }, 300);
  };

  const prepareChartData = () => {
    const totalStock =
      productAnalytics.stock.length > 0 ? productAnalytics.stock[0].STOCK : 0;
    const shipmentQuantity =
      productAnalytics.shipment.length > 0
        ? productAnalytics.shipment[0].QUANTITY
        : 0;

    return [
      { label: "Shipment", value: shipmentQuantity },
      { label: "Total Stock", value: totalStock },
    ];
  };

  const init = async () => {
    const products = await http.getProducts();
    const formatted_data = products.data.map((data) => {
      return { ...data, focus: false };
    });
    if (selectedFilter != "ALL PRODUCTS") {
      const filtered_type = filter.filter((item) => {
        return item.label == selectedFilter;
      });
      const filtered_company = formatted_data.filter((item) => {
        return item.COMPANY == filtered_type[0].typeID;
      });
      setInventory(filtered_company);
    } else {
      setInventory(formatted_data);
    }
  };

  useEffect(() => {
    setSearchQuery("");
    init();
  }, [selectedFilter]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (refresh == true) {
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

  useEffect(() => {
    if (selectedProduct != null) {
      http
        .getProductAnalytics({ PRODUCT_ID: selectedProduct.PRODUCT_ID })
        .then((res) => {
          setProductAnalytics(res.data);
        });
    }
  }, [selectedProduct]);

  const onFocusProduct = (product) => {
    const focusEvent = filteredInventory.map((item) => {
      if (item.PRODUCT_ID === product.PRODUCT_ID) {
        if (item.focus === true) {
          setSelectedProduct(null);
          return { ...item, focus: false };
        } else {
          setSelectedProduct(product);
          return { ...item, focus: true };
        }
      } else {
        return { ...item, focus: false };
      }
    });
    setInventory(focusEvent);
  };

  const tableRows = filteredInventory.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
      onClick={() => onFocusProduct(product)}
    >
      <td
        className={`${
          product.focus
            ? "bg-orange-300 px-4 py-2 border text-black"
            : "px-4 py-2 border text-black"
        }`}
      >
        {product.NAME}
      </td>
      <td
        className={`${
          product.focus
            ? "bg-orange-300 px-4 py-2 border text-black"
            : "px-4 py-2 border text-black"
        }`}
      >
        <span className="bg-green-300 rounded-md px-4 py-2 text-black">
          {product.PRODUCT_ID}
        </span>
      </td>
      <td
        className={`${
          product.focus
            ? "bg-orange-300 px-2 py-1 border text-black"
            : "px-4 py-2 border text-black"
        }`}
      >
        {product.COMPANY}
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
        <div className="container mx-auto p-4">
          <button
            onClick={() => refresh_handler()}
            className="bg-zuma-login text-white px-4 py-2 rounded-md mb-3 mr-3"
          >
            <p>Refresh</p>
          </button>
          <DropdownButton
            setData={setSelectedFilter}
            dataValue={selectedFilter}
            data={{ data: filterOptions }}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 p-4 bg-zuma-green rounded-lg ">
              <div className="overflow-y-auto max-h-96">
                <h2 className="text-lg font-semibold mb-4 text-black">
                  Zuma Products
                </h2>

                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full mb-4 p-2 border rounded-lg text-black"
                  placeholder="Search..."
                />

                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300">
                      <th className="px-4 py-2 border text-black">
                        Product Name
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Product ID
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Company ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>{tableRows}</tbody>
                </table>
              </div>
            </div>
            <div className="col-span-1 p-4 bg-zuma-green rounded-md">
              {productAnalytics != null ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-black">
                    Product Analytics
                  </h2>
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="px-4 py-2 border text-black">Stock</th>
                        <th className="px-4 py-2 border text-black">
                          Stored Stock
                        </th>
                        <th className="px-4 py-2 border text-black">
                          Active Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-2 border text-black">
                          {Math.floor(productAnalytics.stock[0].STOCK)}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {Math.floor(productAnalytics.stock[0].STORED_STOCK)}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {Math.floor(productAnalytics.stock[0].ACTIVE_STOCK)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <h2 className="text-lg font-semibold mb-4 text-black">
                    Most Recent Shipment
                  </h2>
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="px-4 py-2 border text-black">
                          Product Name
                        </th>
                        <th className="px-4 py-2 border text-black">
                          Quantity
                        </th>
                        <th className="px-4 py-2 border text-black">Date</th>
                        <th className="px-4 py-2 borde text-black">Employee</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.shipment.length > 0
                            ? productAnalytics.shipment[0].PRODUCT_NAME
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.shipment.length > 0
                            ? Math.floor(productAnalytics.shipment[0].QUANTITY)
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.shipment.length > 0
                            ? new Date(
                                productAnalytics.shipment[0].DATE
                              ).toDateString()
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.shipment.length > 0
                            ? productAnalytics.shipment[0].EMPLOYEE_ID
                            : "No Data"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-black"> No Product Selected </div>
              )}
            </div>
          </div>
          {/* <div className="flex justify-center items-center mt-4 ">
            <div className="w-full md:w-1/2 bg-gray-200 p-4 text-center px-2 py-2">
              <h2 className="text-lg font-semibold mb-4 text-black">
                Product Visual - Shipment/Stock
              </h2>
              {productAnalytics != null ? (
                <PieChart data={prepareChartData()} />
              ) : null}
            </div>
          </div> */}
        </div>
      </BaseModal>
    </>
  );
}
