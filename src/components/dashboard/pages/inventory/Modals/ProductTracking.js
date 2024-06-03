import React, { useEffect, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ProductTracking(props) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [changeMessage, setChangeMessage] = useState("");

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

  const handleTrackingSubmit = async (productId) => {
    if (productId) {
      const data = {
        productID: productId,
        quantity: quantity === "" ? null : parseInt(quantity),
      };
      await http.updateTracking(data);

      // Update local state without refetching
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.PRODUCT_ID === productId
            ? { ...p, MIN_LIMIT: quantity === "" ? null : parseInt(quantity) }
            : p
        )
      );
      setFilteredProducts((prevFilteredProducts) =>
        prevFilteredProducts.map((p) =>
          p.PRODUCT_ID === productId
            ? { ...p, MIN_LIMIT: quantity === "" ? null : parseInt(quantity) }
            : p
        )
      );

      setChangeMessage(
        quantity === ""
          ? `Removed tracking for ${
              products.find((p) => p.PRODUCT_ID === productId).NAME
            }`
          : `Set tracking limit for ${
              products.find((p) => p.PRODUCT_ID === productId).NAME
            } to ${quantity}`
      );

      setEditingProductId(null);
      setQuantity("");
    }
  };

  const handleEditClick = (productId, currentLimit) => {
    setEditingProductId(productId);
    setQuantity(currentLimit != null ? currentLimit.toString() : "");
  };

  const tableRows = filteredProducts.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${
        product.PRODUCT_ID === editingProductId
          ? "bg-orange-300"
          : index % 2 === 0
          ? "bg-gray-100"
          : "bg-white"
      }`}
    >
      <td className="px-4 py-2 border text-black">{product.NAME}</td>
      <td className="px-4 py-2 border text-black bg-rose-400">
        {product.PRODUCT_ID}
      </td>
      <td
        className={`px-4 py-2 border text-black cursor-pointer ${
          product.PRODUCT_ID === editingProductId ? "bg-green-400" : ""
        }`}
        onClick={() => handleEditClick(product.PRODUCT_ID, product.MIN_LIMIT)}
      >
        {product.PRODUCT_ID === editingProductId ? (
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2"
            autoFocus
          />
        ) : product.MIN_LIMIT != null ? (
          product.MIN_LIMIT
        ) : (
          "Not being tracked"
        )}
      </td>
      <td className="px-4 py-2 border text-black">
        {product.PRODUCT_ID === editingProductId && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
            onClick={() => handleTrackingSubmit(product.PRODUCT_ID)}
          >
            Commit Change
          </button>
        )}
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
        <div className="h-full w-full">
          {changeMessage && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
              {changeMessage}
            </div>
          )}
          <div className="flex flex-1 justify-center items-center">
            <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full">
              <div className="sticky top-0 bg-white z-10">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full mb-4 p-2 border rounded-lg text-black"
                  placeholder="Search..."
                />
              </div>
              <div className="h-[60vh] overflow-y-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-300">
                    <tr>
                      <th className="px-4 py-2 border text-black">
                        Product Name
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Product ID
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Tracking Limit
                      </th>
                      <th className="px-4 py-2 border text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{tableRows}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
