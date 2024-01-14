import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import PieChart from "./Chart";

const http = new http_handler();

export default function ViewInventoryModal(props) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [productAnalytics, setProductAnalytics] = useState(null);

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
    setInventory(formatted_data);
  };

  useEffect(() => {
    init();
  }, []);

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
          console.log(res.data);
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
      >
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-2 gap-4 ">
            <div className="col-span-1 p-4 bg-zuma-green rounded-lg">
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
                  <h2 className="text-lg font-semibold mb-4 text-black">
                    Most Recent Reduction
                  </h2>
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="px-4 py-2 border text-black">
                          Quantity
                        </th>
                        <th className="px-4 py-2 border text-black">Date</th>
                        <th className="px-4 py-2 border text-black">
                          Employee
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.reduction.length > 0
                            ? productAnalytics.reduction[0].QUANTITY.toFixed(2)
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.reduction.length > 0
                            ? new Date(
                                productAnalytics.reduction[0].DATE
                              ).toDateString()
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.reduction.length > 0
                            ? productAnalytics.reduction[0].EMPLOYEE_ID
                            : "No Data"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <h2 className="text-lg font-semibold mb-4 text-black">
                    Most Recent Activation
                  </h2>
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="px-4 py-2 border text-black">
                          Quantity
                        </th>
                        <th className="px-4 py-2 border text-black">Date</th>
                        <th className="px-4 py-2 border text-black">
                          Employee
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.activation.length > 0
                            ? productAnalytics.activation[0].QUANTITY.toFixed(2)
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.activation.length > 0
                            ? new Date(
                                productAnalytics.activation[0].DATE
                              ).toDateString()
                            : "No Data"}
                        </td>
                        <td className="px-4 py-2 border text-black">
                          {productAnalytics.activation.length > 0
                            ? productAnalytics.activation[0].EMPLOYEE_ID
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
          <div className="flex justify-center items-center mt-4 ">
            <div className="w-full md:w-1/2 bg-gray-200 p-4 text-center px-2 py-2">
              <h2 className="text-lg font-semibold mb-4 text-black">
                Product Visual - Shipment/Stock
              </h2>
              {productAnalytics != null ? (
                <PieChart data={prepareChartData()} />
              ) : null}
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
