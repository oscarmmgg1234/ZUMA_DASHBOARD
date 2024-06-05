import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch } from "react-icons/fa"; // Importing the search icon

export default function EditView(props) {
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [editedFields, setEditedFields] = useState({});
  const [success, setSuccess] = useState(false);
  const productListRef = useRef(null);
  const rowRef = useRef(null);
  const previousSelectedProductIndex = useRef(null);
  const previousSelectedCompany = useRef("All");

  useEffect(() => {
    const fetchData = async () => {
      const companiesData = await props.api.getPartnerCompanies();
      setCompanies(companiesData.data);
      const products = await props.api.getProducts();
      setProductList(products.data);
      const productTypesData = await props.api.getProductTypes();
      setProductTypes(productTypesData.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      previousSelectedProductIndex.current = filteredProducts.findIndex(
        (product) => product.PRODUCT_ID === selectedProduct.PRODUCT_ID
      );
    }
  }, [selectedProduct]);

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
      selectedCompany === "All" || product.COMPANY == selectedCompany;
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

    if (updates.length === 0) {
      console.log("No changes made.");
      return;
    }

    const payload = {
      PRODUCT_ID: selectedProduct.PRODUCT_ID,
      updates,
    };

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

  return (
    <div className="relative">
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
                className="h-[700px] overflow-y-auto border-t border-gray-300"
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
                  <tbody className="bg-white divide-y divide-gray-200">
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
                              : "bg-white text-black"
                            : selectedProduct === product
                            ? "bg-orange-500 text-white font-bold"
                            : "bg-gray-300 text-black"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {product.NAME}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {product.PRODUCT_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {product.TYPE}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
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
          <button
            onClick={handleCommitChanges}
            className="w-full p-4 bg-green-500 text-white rounded text-lg font-semibold"
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
    </div>
  );
}
