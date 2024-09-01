import React, { useState, useEffect } from "react";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import BaseModal from "./Base";
import { format } from "date-fns";

const http = new http_handler();

export default function ProductHistory(props) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [startRange, setStartRange] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [endRange, setEndRange] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyOverlayVisible, setHistoryOverlayVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const products = await http.getProducts();
      const sortedProducts = products.data.sort((a, b) =>
        a.NAME.localeCompare(b.NAME)
      );
      const filteredProducts = sortedProducts.filter(
        (product) => product.TYPE === "122" || product.TYPE === "44"
      );
      setProducts(filteredProducts);
      setFilteredProducts(filteredProducts);
    };
    init();
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductModalVisible(false);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = products.filter((product) =>
      product.NAME.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const fetchProductHistory = async () => {
    if (!selectedProduct) {
      return alert("Please select a product");
    }
    const range = {
      start: startRange,
      end: endRange,
    };

    try {
      const history = await http.getProductHistory(
        selectedProduct.PRODUCT_ID,
        range
      );

      if (history.status) {
        if (history.data.length === 0) {
          alert(
            "No product transaction found during the specified date range."
          );
          setProductHistory([]);
          setHistoryOverlayVisible(false);
        } else {
          setProductHistory(history.data);
          setHistoryOverlayVisible(true);
        }
      } else {
        alert("No product transaction found during the specified date range.");
        setProductHistory([]);
        setHistoryOverlayVisible(false);
      }
    } catch (error) {
      console.error("Failed to fetch product history:", error);
      alert(
        "An error occurred while fetching the product history. Please try again later."
      );
    }
  };

  const renderProductModal = () => (
    <BaseModal
      visible={productModalVisible}
      closeHandler={() => setProductModalVisible(false)}
      title={"Select Product"}
    >
      <div className="p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="w-full p-2 mb-4 border border-gray-300 rounded text-black"
        />
        <div className="max-h-80 overflow-y-auto">
          {filteredProducts.map((product, index) => (
            <div
              key={product.PRODUCT_ID}
              className={`p-3 mb-2 rounded-md cursor-pointer transition-colors duration-300 
                ${
                  product.PRODUCT_ID === selectedProduct?.PRODUCT_ID
                    ? "bg-blue-100 border-l-4 border-blue-500"
                    : index % 2 === 0
                    ? "bg-white hover:bg-gray-100"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              onClick={() => handleProductSelect(product)}
            >
              <p className="font-semibold text-gray-800">{product.NAME}</p>
              <p className="text-sm text-gray-600">ID: {product.PRODUCT_ID}</p>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );

  const renderStockTable = (stockData) => {
    return (
      <table className="w-full text-xs text-left text-gray-700 mt-2">
        <thead>
          <tr>
            <th className="border px-2 py-1">Product Name</th>
            <th className="border px-2 py-1">Stock</th>
            <th className="border px-2 py-1">Stored Stock</th>
            <th className="border px-2 py-1">Active Stock</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((item, index) => (
            <tr key={index}>
              <td className="border px-2 py-1 text-black">
                {item.product_name}
              </td>
              <td className="border px-2 py-1">{item.stock}</td>
              <td className="border px-2 py-1">{item.stored}</td>
              <td className="border px-2 py-1">{item.active}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const groupedHistory = productHistory.reduce((acc, entry) => {
    const entryDate = new Date(entry.DATE);
    const dayKey = format(entryDate, "yyyy-MM-dd");
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const getTotalTransactions = () => {
    let total = 0;
    for (const product in productHistory) {
      total += 1;
    }
    return total;
  };
  const renderHistory = () => {
    const dayEntries = Object.keys(groupedHistory)
      .sort((a, b) => new Date(b) - new Date(a)) // Sort by most recent date
      .map((dayKey) => {
        const entries = groupedHistory[dayKey];
        return (
          <div
            key={dayKey}
            className="mb-6 bg-white rounded-lg p-4 shadow-md border border-orange-200 bg-orange-50"
          >
            <h3 className="font-bold text-lg text-gray-700 mb-4">
              {format(new Date(dayKey), "eeee, MMMM do, yyyy")}
            </h3>
            {entries.map((entry, index) => (
              <div key={index} className="border-b border-gray-200 py-2">
                <p className="text-xs text-gray-600">
                  Transaction ID: {entry.TRANSACTIONID}
                </p>
                <p className="text-sm text-gray-600">
                  Employee: {entry.EMPLOYEE_NAME}
                </p>
                <p className="text-sm text-gray-600">
                  Protocol Reference: {entry.PRODUCT_NAME}
                </p>
                <p className="text-sm text-gray-600">
                  Product Name: {entry.ACTION}
                </p>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  {entry.REVERSED == 0 ? "Committed" : "Error and Reverted"}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(entry.DATE), "yyyy-MM-dd HH:mm:ss")}
                </p>
                {entry.before_stock && (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mt-2">
                      Before Stock:
                    </p>
                    {renderStockTable(entry.before_stock)}
                  </>
                )}
                {entry.after_stock && (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mt-2">
                      After Stock:
                    </p>
                    {renderStockTable(entry.after_stock)}
                  </>
                )}
              </div>
            ))}
          </div>
        );
      });
    return dayEntries;
  };

  const FullPageOverlay = ({ visible, onClose, children }) => {
    if (!visible) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white w-full h-full p-5 overflow-y-auto relative">
          <button
            className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md z-10"
            onClick={onClose}
          >
            Back
          </button>
          <div className="mt-16">
            <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-md">
              <h2 className="font-semibold text-gray-800 text-lg">
                Product: {selectedProduct.NAME}
              </h2>
              <p className="text-sm text-gray-600">
                Date Range: {startRange} to {endRange}
              </p>
              <p className="text-sm text-gray-600">
                Total Transactions: {getTotalTransactions()}
              </p>
            </div>{" "}
            {/* This adds space below the Back button */}
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Product History"}
      closeName={"productHistory"}
    >
      <div className="p-5 bg-gray-100">
        <div className="mb-5 p-4 bg-white rounded-lg shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Start Date:
          </label>
          <input
            type="date"
            className="border border-gray-300 rounded-md p-2 text-sm w-full mb-4 text-black"
            value={startRange}
            onChange={(e) => setStartRange(e.target.value)}
            placeholder="YYYY-MM-DD"
          />
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-black">
            End Date:
          </label>
          <input
            type="date"
            className="border border-gray-300 rounded-md p-2 text-sm w-full mb-4 text-black"
            value={endRange}
            onChange={(e) => setEndRange(e.target.value)}
            placeholder="YYYY-MM-DD"
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition mb-4"
            onClick={() => setProductModalVisible(true)}
          >
            Select Product
          </button>
          {selectedProduct && (
            <div className="p-2 bg-gray-200 rounded-md mb-4">
              <p className="font-semibold text-black">Selected Product:</p>
              <p className="text-black">{selectedProduct.NAME}</p>
              <p className="text-sm text-gray-600">
                ID: {selectedProduct.PRODUCT_ID}
              </p>
            </div>
          )}
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
            onClick={fetchProductHistory}
          >
            Fetch History
          </button>
        </div>
        <FullPageOverlay
          visible={historyOverlayVisible}
          onClose={() => setHistoryOverlayVisible(false)}
        >
          {renderHistory()}
        </FullPageOverlay>
        {renderProductModal()}
      </div>
    </BaseModal>
  );
}
