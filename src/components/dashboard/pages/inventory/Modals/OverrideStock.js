import React, { useEffect, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function OverrideStock(props) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [inventoryMap, setInventoryMap] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [changeMessage, setChangeMessage] = useState("");

  const init = async () => {
    const productInventory = await http.getProductsInventory();
    const inventoryMap = new Map(
      productInventory.data.map((item) => [item.PRODUCT_ID, item])
    );
    setInventoryMap(inventoryMap);

    const products = await http.getProducts();
    const formatted_products = products.data.map((product) => {
      return { ...product, focus: false };
    });

    setProducts(formatted_products);
    setFilteredProducts(formatted_products);
  };

  const handleUpdateStock = async (productId) => {
    if (!quantity || !editingField || editingProductId !== productId) {
      setChangeMessage("Fields cannot be empty");
      return;
    }

    const currentStock =
      editingField === "STORED_STOCK"
        ? inventoryMap.get(productId)?.STORED_STOCK
        : inventoryMap.get(productId)?.ACTIVE_STOCK;

    const difference = parseFloat(quantity) - currentStock;

    const data = {
      PRODUCT_ID: productId,
      QUANTITY: difference,
    };
    await http.updateStock(data, editingField === "STORED_STOCK");

    // Update local state without refreshing the entire view
    setInventoryMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      const updatedProduct = { ...updatedMap.get(productId) };
      if (editingField === "STORED_STOCK") {
        updatedProduct.STORED_STOCK = parseFloat(quantity);
      } else {
        updatedProduct.ACTIVE_STOCK = parseFloat(quantity);
      }
      updatedMap.set(productId, updatedProduct);
      return updatedMap;
    });

    setChangeMessage(
      `Stock changed for ${
        products.find((p) => p.PRODUCT_ID === productId).NAME
      } to ${quantity}`
    );
    setEditingProductId(null);
    setEditingField(null);
    setQuantity("");
  };

  const handleEditClick = (productId, field) => {
    setEditingProductId(productId);
    setEditingField(field);
    const currentStock =
      field === "STORED_STOCK"
        ? inventoryMap.get(productId)?.STORED_STOCK
        : inventoryMap.get(productId)?.ACTIVE_STOCK;
    setQuantity(currentStock.toFixed(2));
  };

  useEffect(() => {
    if (searchQuery === "") return setFilteredProducts(products);
    else {
      const newData = products.filter((item) =>
        item.NAME.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(newData);
    }
  }, [searchQuery]);

  useEffect(() => {
    init();
  }, []);

  const tableRows = filteredProducts.map((product, index) => (
    <tr
      key={product.PRODUCT_ID}
      className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} ${
        product.focus ? "bg-orange-300" : ""
      }`}
    >
      <td className="px-4 py-2 border text-black">{product.NAME}</td>
      <td className="px-4 py-2 border text-black bg-rose-400">
        {product.PRODUCT_ID}
      </td>
      <td
        className={`px-4 py-2 border text-black cursor-pointer ${
          editingField === "STORED_STOCK" &&
          editingProductId === product.PRODUCT_ID
            ? "bg-green-400"
            : ""
        }`}
        onClick={() => handleEditClick(product.PRODUCT_ID, "STORED_STOCK")}
      >
        {editingProductId === product.PRODUCT_ID &&
        editingField === "STORED_STOCK" ? (
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2"
            autoFocus
          />
        ) : (
          inventoryMap.get(product.PRODUCT_ID)?.STORED_STOCK.toFixed(2) || "N/A"
        )}
      </td>
      <td
        className={`px-4 py-2 border text-black cursor-pointer ${
          editingField === "ACTIVE_STOCK" &&
          editingProductId === product.PRODUCT_ID
            ? "bg-green-400"
            : ""
        }`}
        onClick={() => handleEditClick(product.PRODUCT_ID, "ACTIVE_STOCK")}
      >
        {editingProductId === product.PRODUCT_ID &&
        editingField === "ACTIVE_STOCK" ? (
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2"
            autoFocus
          />
        ) : (
          inventoryMap.get(product.PRODUCT_ID)?.ACTIVE_STOCK.toFixed(2) || "N/A"
        )}
      </td>
      <td className="px-4 py-2 border text-black">
        {editingProductId === product.PRODUCT_ID && (
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
            onClick={() => handleUpdateStock(product.PRODUCT_ID)}
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
        title={"Manual Stock Override"}
        closeName={"manual"}
      >
        <div className="h-full w-full">
          <div className="flex flex-1 justify-center items-center">
            <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full h-70vh">
              {changeMessage && (
                <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
                  {changeMessage}
                </div>
              )}
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
              <div className="h-[55vh] overflow-y-auto">
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
                        Stored Stock
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Active Stock
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
