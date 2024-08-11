import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch } from "react-icons/fa";

export default function EditProduct(props) {
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [editedFields, setEditedFields] = useState({});
  const [success, setSuccess] = useState(false);
  const [funcRegistry, setFuncRegistry] = useState([]);
  const [actionRows, setActionRows] = useState([]);
  const [reductionRows, setReductionRows] = useState([]);
  const [shipmentRows, setShipmentRows] = useState([]);
  const [tokenChanged, setTokenChanged] = useState(false);
  const productListRef = useRef(null);
  const rowRef = useRef(null);
  const previousSelectedProductIndex = useRef(null);
  const previousSelectedCompany = useRef("All");
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [currentSection, setCurrentSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const companiesData = await props.api.getPartnerCompanies();
      setCompanies(companiesData.data);
      const products = await props.api.getProducts();
      setProductList(products.data);
      const productTypesData = await props.api.getProductTypes();
      setProductTypes(productTypesData.data);
      const registryData = await props.api.fetchRegistry();
      setFuncRegistry(registryData);
    };
    fetchData();
  }, [props.api]);

  useEffect(() => {
    if (selectedProduct) {
      previousSelectedProductIndex.current = filteredProducts.findIndex(
        (product) => product.PRODUCT_ID === selectedProduct.PRODUCT_ID
      );
      const activationTokens = selectedProduct.ACTIVATION_TOKEN
        ? selectedProduct.ACTIVATION_TOKEN.split(" ")
            .filter((token) => token)
            .map((token) => parseToken(token, "activation"))
        : [];
      const reductionTokens = selectedProduct.REDUCTION_TOKEN
        ? selectedProduct.REDUCTION_TOKEN.split(" ")
            .filter((token) => parseToken(token, "reduction").product.id)
            .map((token) => parseToken(token, "reduction"))
        : [];
      const shipmentTokens = selectedProduct.SHIPMENT_TOKEN
        ? selectedProduct.SHIPMENT_TOKEN.split(" ")
            .filter((token) => token)
            .map((token) => parseToken(token, "shipment"))
        : [];
      setActionRows(activationTokens);
      setReductionRows(reductionTokens);
      setShipmentRows(shipmentTokens);
    }
  }, [selectedProduct]);

  const parseToken = (token, type) => {
    const parts = token.split(":");
    return {
      class: parts[0],
      id: parts[1],
      product: { id: parts[2], name: getProductName(parts[2]) },
      param1: parts[3] || "",
      param2: parts[4] || "",
      param3: parts[5] || "",
    };
  };

  const getProductName = (productId) => {
    const product = productList.find((p) => p.PRODUCT_ID === productId);
    return product ? product.NAME : "";
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setEditedFields({
      TYPE: product.TYPE,
      COMPANY: product.COMPANY,
      NAME: product.NAME,
      UNIT_TYPE: product.UNIT_TYPE,
      LOCATION: product.LOCATION,
    });
    previousSelectedCompany.current = selectedCompany;
    setShowProductList(false);
    setSuccess(false);
  };

  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
  };

  const filteredProducts = productList.filter((product) => {
    const matchesSearch = product.NAME.toLowerCase().includes(
      searchQuery.toLowerCase()
    );
    const matchesCompany =
      selectedCompany === "All" || product.COMPANY === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const calculateScrollOffset = useCallback(() => {
    if (rowRef.current && productListRef.current) {
      const rowHeight = rowRef.current.clientHeight;
      const containerHeight = productListRef.current.clientHeight;
      const index = previousSelectedProductIndex.current;
      if (index !== null && index >= 0) {
        const offset = index * rowHeight - containerHeight / 2 + rowHeight / 2;
        productListRef.current.scrollTo({
          top: offset,
          behavior: "smooth",
        });
      }
    }
  }, []);

  const toggleProductList = () => {
    setShowProductList((prev) => {
      if (!prev && previousSelectedProductIndex.current !== null) {
        setSelectedCompany(previousSelectedCompany.current);
        setTimeout(calculateScrollOffset, 0);
      }
      return !prev;
    });
  };

  const handleFieldChange = (field, value) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCommitChanges = async () => {
    const updates = Object.keys(editedFields).reduce((acc, key) => {
      if (editedFields[key] !== selectedProduct[key]) {
        acc.push({ field: key, value: editedFields[key] });
      }
      return acc;
    }, []);

    const payload = {
      PRODUCT_ID: selectedProduct.PRODUCT_ID,
      updates,
      ACTIVATION_TOKEN: compileTokens(actionRows),
      REDUCTION_TOKEN: compileTokens(reductionRows),
      SHIPMENT_TOKEN: compileTokens(shipmentRows),
      tokenChanged,
    };

    console.log("Payload:", payload);
    const response = await props.api.commitChanges(payload);

    if (response.status === true) {
      // Update local product state
      setProductList((prevList) =>
        prevList.map((product) =>
          product.PRODUCT_ID === selectedProduct.PRODUCT_ID
            ? { ...product, ...editedFields }
            : product
        )
      );
      setSuccess(true);
    } else {
      // Handle error (optional)
      console.error("Failed to update product");
    }
  };

  const compileTokens = (rows) => {
    return rows
      .map(
        (row) =>
          `${row.class}:${row.id}:${row.product.id}${
            row.param1 ? `:${row.param1}` : ""
          }${row.param2 ? `:${row.param2}` : ""}${
            row.param3 ? `:${row.param3}` : ""
          }`
      )
      .join(" ")
      .trim();
  };

  const renderField = (label, field, options = []) => {
    const isEdited =
      editedFields[field] !== undefined &&
      editedFields[field] !== selectedProduct[field];
    const isDropdown = options.length > 0;

    return (
      <div className="mb-4">
        <label className="block mb-2 text-black">{label}</label>
        <div className="relative">
          {isDropdown ? (
            <select
              value={editedFields[field] || selectedProduct[field] || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full p-2 border ${
                isEdited ? "border-green-500" : "border-gray-300"
              } rounded text-black`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {`${option.value} - ${option.label}`}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editedFields[field] || selectedProduct[field] || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`w-full p-2 border ${
                isEdited ? "border-green-500" : "border-gray-300"
              } rounded text-black`}
            />
          )}
          {isEdited && (
            <span className="absolute right-2 top-2 text-green-500">
              Edited
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteProduct = async () => {
    const password = prompt("Enter password to delete the product:");
    if (password === "zumadelete") {
      const confirmation = window.confirm(
        "Are you sure you want to delete this product?"
      );
      if (confirmation) {
        try {
          const response = await props.api.deleteProduct({
            PRODUCT_ID: selectedProduct.PRODUCT_ID,
          });
          if (response.status === true) {
            alert("Product deleted successfully");
            setProductList((prevList) =>
              prevList.filter(
                (product) => product.PRODUCT_ID !== selectedProduct.PRODUCT_ID
              )
            );
            setSelectedProduct(null);
          } else {
            alert("Product deletion failed");
          }
        } catch (error) {
          console.error("Error deleting product:", error);
          alert("An error occurred while deleting the product");
        }
      }
    } else {
      alert("Incorrect password. Deletion cancelled.");
    }
  };

  const openOverlay = (index, section) => {
    setSelectedRowIndex(index);
    setCurrentSection(section);
    setIsOverlayVisible(true);
  };

  const closeOverlay = () => {
    setIsOverlayVisible(false);
    setSearchTerm("");
  };

  const selectProduct = (productID, productName) => {
    setTokenChanged(true);
    if (currentSection === "activation") {
      const updatedRows = actionRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setActionRows(updatedRows);
    } else if (currentSection === "reduction") {
      const updatedRows = reductionRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setReductionRows(updatedRows);
    } else if (currentSection === "shipment") {
      const updatedRows = shipmentRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setShipmentRows(updatedRows);
    }
    closeOverlay();
  };

  const handleRowChange = (index, e, type) => {
    const { name, value } = e.target;
    setTokenChanged(true);
    if (type === "activation") {
      const updatedRows = actionRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setActionRows(updatedRows);
    } else if (type === "reduction") {
      const updatedRows = reductionRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setReductionRows(updatedRows);
    } else if (type === "shipment") {
      const updatedRows = shipmentRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setShipmentRows(updatedRows);
    }
  };

  const handleAddRow = (type) => {
    setTokenChanged(true);
    if (type === "activation") {
      setActionRows([
        ...actionRows,
        {
          class: "",
          id: "",
          product: { id: "", name: "" },
          param1: "",
          param2: "",
          param3: "",
        },
      ]);
    } else if (type === "reduction") {
      setReductionRows([
        ...reductionRows,
        {
          class: "",
          id: "",
          product: { id: "", name: "" },
          param1: "",
          param2: "",
          param3: "",
        },
      ]);
    } else if (type === "shipment") {
      setShipmentRows([
        ...shipmentRows,
        {
          class: "",
          id: "",
          product: { id: "", name: "" },
          param1: "",
          param2: "",
          param3: "",
        },
      ]);
    }
  };

  const handleDeleteRow = (index, type) => {
    setTokenChanged(true);
    if (type === "activation") {
      const updatedRows = actionRows.filter((row, i) => i !== index);
      setActionRows(updatedRows);
    } else if (type === "reduction") {
      const updatedRows = reductionRows.filter((row, i) => i !== index);
      setReductionRows(updatedRows);
    } else if (type === "shipment") {
      const updatedRows = shipmentRows.filter((row, i) => i !== index);
      setShipmentRows(updatedRows);
    }
  };

  return (
    <div className="relative h-[62vh]">
      <button
        onClick={toggleProductList}
        className="w-full p-4 bg-orange-400 text-white rounded mb-2 text-lg font-semibold"
      >
        {selectedProduct
          ? `${selectedProduct.NAME} (press to select another product)`
          : "Select a Product"}
      </button>

      {showProductList && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleProductList}
          ></div>
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
            <div className="bg-white rounded shadow-lg w-full max-w-3xl">
              <div className="sticky top-0 bg-white z-10 p-4 flex items-center">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded text-black bg-gray-100"
                  />
                </div>
                <button
                  onClick={toggleProductList}
                  className="ml-4 bg-red-500 text-white p-2 rounded"
                >
                  Back
                </button>
              </div>
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="w-full p-2 border-t border-b border-gray-300 mt-2 text-black bg-gray-100"
              >
                <option value="All">All Companies</option>
                {companies.map((company) => (
                  <option key={company.COMPANY_ID} value={company.COMPANY_ID}>
                    {company.NAME}
                  </option>
                ))}
              </select>
              <div
                ref={productListRef}
                className="h-[40vh] overflow-y-auto border-t border-gray-300"
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Product ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Company
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-700 text-white divide-y divide-gray-600">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={index}
                        ref={index === 0 ? rowRef : null}
                        onClick={() => handleProductClick(product)}
                        className={`cursor-pointer ${
                          selectedProduct === product
                            ? "bg-orange-500 text-white font-bold"
                            : ""
                        } ${
                          index % 2 === 0
                            ? selectedProduct === product
                              ? "bg-orange-500 text-white font-bold"
                              : "bg-gray-600 text-white"
                            : selectedProduct === product
                            ? "bg-orange-500 text-white font-bold"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.NAME}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.PRODUCT_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.TYPE}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.COMPANY}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <div className="mt-4">
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
              Successfully changed objects
            </div>
          )}
          {renderField("Name", "NAME")}
          {renderField(
            "Type",
            "TYPE",
            productTypes.map((pt) => ({ value: pt.TYPE_ID, label: pt.TYPE }))
          )}
          {renderField(
            "Company",
            "COMPANY",
            companies.map((c) => ({ value: c.COMPANY_ID, label: c.NAME }))
          )}
          {renderField("Unit Type", "UNIT_TYPE", [
            { value: "UNIT", label: "UNIT" },
            { value: "BUNDLE", label: "BUNDLE" },
          ])}
          {renderField("Location", "LOCATION", [
            { value: "4322", label: "4322" },
          ])}
          {/* Add more fields as needed */}

          {/* Token List Sections */}
          <div className="w-full mb-4 bg-gray-700 p-4 rounded">
            <h3 className="mb-2 text-white">Activation Tokens</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-white">Class</th>
                  <th className="border p-2 text-white">ID</th>
                  <th className="border p-2 text-white">Product</th>
                  <th className="border p-2 text-white">Param1</th>
                  <th className="border p-2 text-white">Param2</th>
                  <th className="border p-2 text-white">Param3</th>
                  <th className="border p-2 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actionRows.map((row, index) => (
                  <tr
                    key={index}
                    className={`${
                      row.class ||
                      row.id ||
                      row.product.id ||
                      row.param1 ||
                      row.param2 ||
                      row.param3
                        ? "bg-white"
                        : ""
                    }`}
                  >
                    <td className="border p-2">
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select Class</option>
                        <option value="AC">AC</option>
                        <option value="RD">RD</option>
                        <option value="UP">UP</option>
                      </select>
                    </td>
                    <td className="border p-2">
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select ID</option>
                        {funcRegistry
                          .filter((func) => func.class === row.class)
                          .map((func) => (
                            <option key={func.id} value={func.id}>
                              {func.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => openOverlay(index, "activation")}
                        className="w-full p-2 bg-gray-300 text-black"
                      >
                        {row.product.name || "Select Product"}
                      </button>
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param1"
                        value={row.param1}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param2"
                        value={row.param2}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param3"
                        value={row.param3}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleDeleteRow(index, "activation")}
                        className="w-full p-2 bg-red-500 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => handleAddRow("activation")}
              className="w-full p-2 bg-orange-500 text-white mt-2"
            >
              Add Activation Token
            </button>
          </div>

          <div className="w-full mb-4 bg-gray-700 p-4 rounded">
            <h3 className="mb-2 text-white">Reduction Tokens</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-white">Class</th>
                  <th className="border p-2 text-white">ID</th>
                  <th className="border p-2 text-white">Product</th>
                  <th className="border p-2 text-white">Param1</th>
                  <th className="border p-2 text-white">Param2</th>
                  <th className="border p-2 text-white">Param3</th>
                  <th className="border p-2 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reductionRows.map((row, index) => (
                  <tr
                    key={index}
                    className={`${
                      row.class ||
                      row.id ||
                      row.product.id ||
                      row.param1 ||
                      row.param2 ||
                      row.param3
                        ? "bg-white"
                        : ""
                    }`}
                  >
                    <td className="border p-2">
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select Class</option>
                        <option value="CM">CM</option>
                        <option value="CMUP">CMUP</option>
                      </select>
                    </td>
                    <td className="border p-2">
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select ID</option>
                        {funcRegistry
                          .filter((func) => func.class === row.class)
                          .map((func) => (
                            <option key={func.id} value={func.id}>
                              {func.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => openOverlay(index, "reduction")}
                        className="w-full p-2 bg-gray-300 text-black"
                      >
                        {row.product.name || "Select Product"}
                      </button>
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param1"
                        value={row.param1}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param2"
                        value={row.param2}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param3"
                        value={row.param3}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleDeleteRow(index, "reduction")}
                        className="w-full p-2 bg-red-500 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => handleAddRow("reduction")}
              className="w-full p-2 bg-orange-500 text-white mt-2"
            >
              Add Reduction Token
            </button>
          </div>

          <div className="w-full mb-4 bg-gray-700 p-4 rounded">
            <h3 className="mb-2 text-white">Shipment Tokens</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-white">Class</th>
                  <th className="border p-2 text-white">ID</th>
                  <th className="border p-2 text-white">Product</th>
                  <th className="border p-2 text-white">Param1</th>
                  <th className="border p-2 text-white">Param2</th>
                  <th className="border p-2 text-white">Param3</th>
                  <th className="border p-2 text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipmentRows.map((row, index) => (
                  <tr
                    key={index}
                    className={`${
                      row.class ||
                      row.id ||
                      row.product.id ||
                      row.param1 ||
                      row.param2 ||
                      row.param3
                        ? "bg-white"
                        : ""
                    }`}
                  >
                    <td className="border p-2">
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select Class</option>
                        <option value="SH">SH</option>
                        <option value="UP">UP</option>
                      </select>
                    </td>
                    <td className="border p-2">
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        className="w-full p-2 text-black"
                      >
                        <option value="">Select ID</option>
                        {funcRegistry
                          .filter((func) => func.class === row.class)
                          .map((func) => (
                            <option key={func.id} value={func.id}>
                              {func.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => openOverlay(index, "shipment")}
                        className="w-full p-2 bg-gray-300 text-black"
                      >
                        {row.product.name || "Select Product"}
                      </button>
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param1"
                        value={row.param1}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param2"
                        value={row.param2}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        name="param3"
                        value={row.param3}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        className="w-full p-2 text-black"
                      />
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleDeleteRow(index, "shipment")}
                        className="w-full p-2 bg-red-500 text-white"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => handleAddRow("shipment")}
              className="w-full p-2 bg-orange-500 text-white mt-2"
            >
              Add Shipment Token
            </button>
          </div>

          <button
            onClick={handleCommitChanges}
            className="w-full p-4 bg-green-500 text-white rounded text-lg font-semibold mt-8"
          >
            Commit Changes
          </button>
          <button
            onClick={handleDeleteProduct}
            className="w-full mt-2 p-4 bg-red-500 text-white rounded text-lg font-semibold"
          >
            Delete Product
          </button>
        </div>
      )}

      {isOverlayVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "80%",
              maxHeight: "80%",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1em",
              }}
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-black"
              />
              <button
                onClick={closeOverlay}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  marginLeft: "10px",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                Back
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "10px",
                      backgroundColor: "black",
                      color: "white",
                    }}
                  >
                    Product Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.PRODUCT_ID}
                    onClick={() =>
                      selectProduct(product.PRODUCT_ID, product.NAME)
                    }
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid black",
                      backgroundColor: index % 2 === 0 ? "white" : "#d1d5db",
                    }}
                  >
                    <td style={{ padding: "10px", color: "black" }}>
                      {product.NAME}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
