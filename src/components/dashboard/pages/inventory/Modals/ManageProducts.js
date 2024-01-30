import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ManageProducts(props) {
  const [action, setAction] = useState(true);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("4322");
  const [company, setCompany] = useState("");
  const [processComponentType, setProcessComponentType] = useState("");
  const [processType, setProcessType] = useState("");
  const [reductionType, setReductionType] = useState("");
  const [shipmentType, setShipmentType] = useState("");
  const [unitBundle, setUnitBundle] = useState("BUNDLE");
  const [min_limit, set_min_limit] = useState("");
  const [pillRatio, setPillRatio] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const reset = () => {
    setCompany("");
    setPrice("");
    setShipmentType("");
    setReductionType("");
    setProcessComponentType("");
    setProcessType("");
    setUnitBundle("BUNDLE");
    setType("");
    setProductName("");
    setSearchQuery("");
    setDescription("");
    setLocation("");
    set_min_limit("");
    setSelectedProduct(null);
    setPillRatio("");
  };

  const init = async () => {
    const products = await http.getProducts();
    const formated_products = products.data.map((product) => {
      return { ...product, focus: false };
    });

    setProducts(formated_products);
    setFilteredProducts(formated_products);
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
  useEffect(() => {
    reset();
    init();
  }, [action]);

  const onFocusProduct = (product) => {
    const focusEvent = filteredProducts.map((item) => {
      if (item.PRODUCT_ID === product.PRODUCT_ID) {
        return { ...item, focus: !item.focus };
      } else {
        return { ...item, focus: false };
      }
    });
    setSelectedProduct(product.focus ? null : product);
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
      <td className="px-4 py-2 border text-black">{product.COMPANY}</td>
    </tr>
  ));

  const handleAddProduct = () => {
    if (
      !productName ||
      !description ||
      !price ||
      !type ||
      !location ||
      !company ||
      !unitBundle
    ) {
      alert("Please fill in all fields.");
      return; // Stop the function if any field is empty
    }
    const data = {
      name: productName,
      desc: description,
      price: parseFloat(price),
      type: type,
      location: location,
      company: company,
      processType: parseInt(processType),
      processComponentType: parseInt(processComponentType),
      reductionType: parseInt(reductionType),
      shipmentType: parseInt(shipmentType),
      minLimit: parseInt(min_limit),
      unitType: unitBundle,
      pillRatio: pillRatio.length > 0 ? parseFloat(pillRatio) : null,
    };

    http.manageProducts("add", data);
    alert("Product Added");
  };

  const handleDeleteProduct = () => {
    if (selectedProduct == null) {
      alert("Please select a product to delete");
      return;
    }
    const data = {
      productID: selectedProduct.PRODUCT_ID,
    };
    http.manageProducts("delete", data);
    alert("Product Deleted");
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Products"}
      closeName={"manage"}
    >
      <div className="h-full w-full">
        <button
          onClick={() => setAction(!action)}
          className="w-32 h-24 bg-orange-300"
        >
          <p className="text-xs">Click to toggle</p>
          <p className="font-bold">
            {action ? "Add Product" : "Delete Product"}
          </p>
        </button>

        <div className="flex flex-1 justify-center items-center">
          <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full">
            {action ? (
              <div className="flex flex-col space-y-3">
                <label className="font-semibold text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300 text-black"
                />

                <label className="font-semibold text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">Price</label>
                <input
                  type="text"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">Type</label>
                <input
                  type="text"
                  placeholder="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">Location</label>
                <input
                  type="text"
                  placeholder="Type"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">Company</label>
                <input
                  type="text"
                  placeholder="Type"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Process Component Type
                </label>
                <input
                  type="text"
                  placeholder="Process Component Type"
                  value={processComponentType}
                  onChange={(e) => setProcessComponentType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Process Type
                </label>
                <input
                  type="text"
                  placeholder="Process Type"
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Reduction Type
                </label>
                <input
                  type="text"
                  placeholder="Reduction Type"
                  value={reductionType}
                  onChange={(e) => setReductionType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Shipment Type
                </label>
                <input
                  type="text"
                  placeholder="Shipment Type"
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />
                <label className="font-semibold text-gray-700">
                  Product Track Limit
                </label>
                <input
                  type="text"
                  placeholder="minimum amount limit"
                  value={min_limit}
                  onChange={(e) => set_min_limit(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Pill ratio (if applicable)
                </label>
                <input
                  type="text"
                  placeholder="Pill Ratio ?"
                  value={pillRatio}
                  onChange={(e) => setPillRatio(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />
                <label className="font-semibold text-gray-700">
                  Unit Bundle
                </label>
                <select
                  value={unitBundle}
                  onChange={(e) => setUnitBundle(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                >
                  <option value="BUNDLE">BUNDLE</option>
                  <option value="UNIT">UNIT</option>
                </select>

                <button
                  onClick={() => handleAddProduct()}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Add Product
                </button>
              </div>
            ) : (
              <>
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
                {selectedProduct !== null && (
                  <button
                    className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                    onClick={() => handleDeleteProduct()}
                  >
                    Delete Product
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
