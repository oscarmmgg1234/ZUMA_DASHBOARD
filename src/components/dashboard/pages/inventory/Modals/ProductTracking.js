import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ProductTracking(props) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("");

  const init = async () => {
    const products = await http.getProducts();
    setProducts(products.data);
    setFilteredProducts(products.data);
  };

  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (searchQuery === "") return setFilteredProducts(products);
    else {
      const newData = products.filter((item) =>
        item.NAME.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(newData);
    }
  }, [searchQuery]);

  const handleTrackingSubmit = (option) => {
    if (option && product) {
      const data = {
        productID: product.PRODUCT_ID,
        quantity: parseInt(quantity),
      };
      http.updateTracking(data);
      alert(`Tracking Updated for ${product.NAME}`);
      setTimeout(() => {
        init();
      }, 500);
    }
    if (!option && product) {
      const data = {
        productID: product.PRODUCT_ID,
      };
      http.updateTracking(data);
      alert(`Tracking Updated for ${product.NAME}`);
      setTimeout(() => {
        init();
      }, 500);
    } 
    if (!product) {
      alert("Please select a product");
    }
  };

  const onFocusProduct = (product) => {
    const focusEvent = filteredProducts.map((item) => {
      if (item.PRODUCT_ID === product.PRODUCT_ID) {
        return { ...item, focus: !item.focus };
      } else {
        return { ...item, focus: false };
      }
    });
    setProduct(product.focus ? null : product);
    setFilteredProducts(focusEvent);
  };

  const tableRows = filteredProducts.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${
        product.focus
          ? "bg-orange-300"
          : index % 2 === 0
          ? "bg-gray-100"
          : "bg-white"
      }`}
      onClick={() => onFocusProduct(product)}
    >
      <td className="px-4 py-2 border text-black">{product.NAME}</td>
      <td className="px-4 py-2 border text-black bg-rose-400">
        {product.PRODUCT_ID}
      </td>
      <td className="px-4 py-2 border text-black">
        {product.MIN_LIMIT != null ? product.MIN_LIMIT : "Not being tracked"}
      </td>
    </tr>
  ));
  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"Product Tracking"}
        closeName={"tracking"}
      >
        <div className="flex flex-1 justify-center items-center">
          <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full">
            <div className="max-h-96 overflow-y-auto">
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full mb-4 p-2 border rounded-lg text-black"
                placeholder="Search..."
              />
              <table className="min-w-full border-collapse ">
                <thead>
                  <tr className="bg-gray-300">
                    <th className="px-4 py-2 border text-black">
                      Product Name
                    </th>
                    <th className="px-4 py-2 border text-black">Product ID</th>
                    <th className="px-4 py-2 border text-black">
                      Tracking Limit
                    </th>
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>
            <label className="mt-5 mr-5 text-black ">Limit:</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10 px-10 rounded border border-gray-300 text-black mt-5 "
            />
            {product != null && quantity == "" ? (
              <button
                className="mt-4 ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                onClick={() => handleTrackingSubmit(false)}
              >
                Remove Product Limit
              </button>
            ) : product != null  ? (
              <button
                className="mt-4 ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                onClick={() => handleTrackingSubmit(true)}
              >
                Set Product Limit
              </button>
            ) : null}
          </div>
        </div>
      </BaseModal>
    </>
  );
}
