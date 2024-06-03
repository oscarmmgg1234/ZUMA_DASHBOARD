import React, { useState, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";
import http_handler from "../../HTTP/HTTPS_INTERFACE";

function generateRandomID(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default function CustomProduct(props) {
  const [funcRegistry, setFuncRegistry] = useState([]);
  const [generatedIDs, setGeneratedIDs] = useState([]);
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
    location: "4322",
    company: "",
    unitType: "", // Add unitType to the form fields
  });
  const [createLabel, setCreateLabel] = useState(false);
  const [actionRows, setActionRows] = useState([]);
  const [reductionRows, setReductionRows] = useState([]);
  const [shipmentRows, setShipmentRows] = useState([]);
  const [summary, setSummary] = useState("");
  const [reductionSummary, setReductionSummary] = useState("");
  const [shipmentSummary, setShipmentSummary] = useState("");
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [currentSection, setCurrentSection] = useState("");
  const [companies, setCompanies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", visible: false });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await props.api.fetchRegistry();
        const products = await props.api.getProducts();
        const companiesData = await props.api.getPartnerCompanies();
        setCompanies(companiesData.data);
        const productTypesData = await props.api.getProductTypes();
        setProductTypes(productTypesData.data);
        setProductList(products.data);
        setFuncRegistry(response);
        generateIDsinit();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    function generateIDsinit() {
      const initialIDs = [];
      for (let i = 0; i < 2; i++) {
        initialIDs.push(generateRandomID(8));
      }
      setGeneratedIDs(initialIDs);
    }

    fetchData();
  }, [props.api]);

  useEffect(() => {
    if (!createLabel) {
      // Remove label reference if createLabel is toggled off
      setActionRows((rows) =>
        rows.map((row) =>
          row.product.id === generatedIDs[1]
            ? { ...row, product: { id: "", name: "" } }
            : row
        )
      );
      setReductionRows((rows) =>
        rows.map((row) =>
          row.product.id === generatedIDs[1]
            ? { ...row, product: { id: "", name: "" } }
            : row
        )
      );
      setShipmentRows((rows) =>
        rows.map((row) =>
          row.product.id === generatedIDs[1]
            ? { ...row, product: { id: "", name: "" } }
            : row
        )
      );
    }
  }, [createLabel, generatedIDs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields({ ...formFields, [name]: value });
  };

  const handleAddRow = (type) => {
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
    if (type === "activation") {
      const updatedRows = actionRows.filter((row, i) => i !== index);
      setActionRows(updatedRows);
      updateSummary(updatedRows);
    } else if (type === "reduction") {
      const updatedRows = reductionRows.filter((row, i) => i !== index);
      setReductionRows(updatedRows);
      updateReductionSummary(updatedRows);
    } else if (type === "shipment") {
      const updatedRows = shipmentRows.filter((row, i) => i !== index);
      setShipmentRows(updatedRows);
      updateShipmentSummary(updatedRows);
    }
  };

  const handleRowChange = (index, e, type) => {
    const { name, value } = e.target;
    if (type === "activation") {
      const updatedRows = actionRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setActionRows(updatedRows);
      updateSummary(updatedRows);
    } else if (type === "reduction") {
      const updatedRows = reductionRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setReductionRows(updatedRows);
      updateReductionSummary(updatedRows);
    } else if (type === "shipment") {
      const updatedRows = shipmentRows.map((row, i) =>
        i === index ? { ...row, [name]: value } : row
      );
      setShipmentRows(updatedRows);
      updateShipmentSummary(updatedRows);
    }
  };

  const updateSummary = (rows) => {
    const newSummary = rows
      .map((row) => {
        const funcDesc =
          funcRegistry.find((func) => func.id === row.id)?.desc || "";
        return `• ${row.product.name}: ${funcDesc}`;
      })
      .join("\n");
    setSummary(newSummary);
  };

  const updateReductionSummary = (rows) => {
    const newSummary = rows
      .map((row) => {
        const funcDesc =
          funcRegistry.find((func) => func.id === row.id)?.desc || "";
        return `• ${row.product.name}: ${funcDesc}`;
      })
      .join("\n");
    setReductionSummary(newSummary);
  };

  const updateShipmentSummary = (rows) => {
    const newSummary = rows
      .map((row) => {
        const funcDesc =
          funcRegistry.find((func) => func.id === row.id)?.desc || "";
        return `• ${row.product.name}: ${funcDesc}`;
      })
      .join("\n");
    setShipmentSummary(newSummary);
  };

  const filteredFuncRegistry = (cls) => {
    return funcRegistry.filter((func) => func.class === cls);
  };

  const filteredProducts = [
    { PRODUCT_ID: generatedIDs[0], NAME: `Self (${generatedIDs[0]})` },
    ...(createLabel
      ? [{ PRODUCT_ID: generatedIDs[1], NAME: `Label (${generatedIDs[1]})` }]
      : []),
    ...productList.filter((product) =>
      product.NAME.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  ];

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
    if (currentSection === "activation") {
      const updatedRows = actionRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setActionRows(updatedRows);
      updateSummary(updatedRows);
    } else if (currentSection === "reduction") {
      const updatedRows = reductionRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setReductionRows(updatedRows);
      updateReductionSummary(updatedRows);
    } else if (currentSection === "shipment") {
      const updatedRows = shipmentRows.map((row, i) =>
        i === selectedRowIndex
          ? { ...row, product: { id: productID, name: productName } }
          : row
      );
      setShipmentRows(updatedRows);
      updateShipmentSummary(updatedRows);
    }
    closeOverlay();
  };

  const handleTestProduct = async () => {
    setIsLoading(true); // Start loading
    console.log("Test Product:", {
      ...formFields,
      createLabel,
      activationTokens: actionRows,
      reductionTokens: reductionRows,
      shipmentTokens: shipmentRows,
      generatedIDs: generatedIDs,
    });

    const response = await props.api.runtimeTest({
      ...formFields,
      createLabel,
      activationTokens: actionRows,
      reductionTokens: reductionRows,
      shipmentTokens: shipmentRows,
      generatedIDs: generatedIDs,
    });

    setIsLoading(false); // End loading
    console.log(response);

    if (response.status) {
      setNotification({ message: "Test completed successfully!", visible: true });
      setTimeout(() => setNotification({ message: "", visible: false }), 3000);

      const logText = response.log.replace(/\n/g, "<br>");
      const logWindow = window.open("", "Log", "width=800,height=600");
      logWindow.document.write(`
        <html>
          <head><title>Test Log</title></head>
          <body>
            <pre>${logText}</pre>
          </body>
        </html>
      `);
      logWindow.document.close();
    }
  };

  const handleCreateProduct = () => {
    props.api.addProductProcess({
      ...formFields,
      createLabel,
      activationTokens: actionRows,
      reductionTokens: reductionRows,
      shipmentTokens: shipmentRows,
      generatedIDs: generatedIDs,
    });
    setNotification({ message: "Product added successfully!", visible: true });
    setTimeout(() => setNotification({ message: "", visible: false }), 3000);
  };

  const isFieldFilled = (field) => {
    return formFields[field] !== "";
  };

  const generateNewIDs = () => {
    const newIDs = [];
    for (let i = 0; i < 2; i++) {
      newIDs.push(generateRandomID(8));
    }
    setGeneratedIDs(newIDs);
  };

  return (
    <div style={{ color: "black", padding: "20px" }}>
      {isLoading && (
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
              textAlign: "center",
            }}
          >
            <h2>Loading...</h2>
          </div>
        </div>
      )}

      {notification.visible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            backgroundColor: "green",
            color: "white",
            padding: "10px",
            textAlign: "center",
            zIndex: 1001,
          }}
        >
          {notification.message}
        </div>
      )}

      <form
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxHeight: "67vh",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          onClick={generateNewIDs}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            backgroundColor: "blue",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Generate New IDs
        </button>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Name:
          <input
            type="text"
            name="name"
            value={formFields.name}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("name")
                ? "2px solid green"
                : "1px solid silver",
            }}
          />
        </label>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Description:
          <input
            type="text"
            name="description"
            value={formFields.description}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("description")
                ? "2px solid green"
                : "1px solid silver",
            }}
          />
        </label>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Price:
          <input
            type="text"
            name="price"
            value={formFields.price}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("price")
                ? "2px solid green"
                : "1px solid silver",
            }}
          />
        </label>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Type:
          <select
            name="type"
            value={formFields.type}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("type")
                ? "2px solid green"
                : "1px solid silver",
            }}
          >
            <option value="">Select Type</option>
            {productTypes.map((type) => (
              <option key={type.TYPE_ID} value={type.TYPE_ID}>
                {type.TYPE} ({type.TYPE_ID})
              </option>
            ))}
          </select>
        </label>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Location:
          <select
            name="location"
            value={formFields.location}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("location")
                ? "2px solid green"
                : "1px solid silver",
            }}
          >
            <option value="4322">4322</option>
          </select>
        </label>
        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Company:
          <select
            name="company"
            value={formFields.company}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("company")
                ? "2px solid green"
                : "1px solid silver",
            }}
          >
            <option value="">Select Company</option>
            {companies.map((company) => (
              <option key={company.COMPANY_ID} value={company.COMPANY_ID}>
                {company.NAME} ({company.COMPANY_ID})
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
        >
          Unit Type:
          <select
            name="unitType"
            value={formFields.unitType}
            onChange={handleInputChange}
            style={{
              width: "100%",
              border: isFieldFilled("unitType")
                ? "2px solid green"
                : "1px solid silver",
            }}
          >
            <option value="">Select Unit Type</option>
            <option value="UNIT">UNIT</option>
            <option value="BUNDLE">BUNDLE</option>
          </select>
        </label>

        <label style={{ width: "100%", marginBottom: "20px" }}>
          Create Label For this Product:
          <input
            type="checkbox"
            checked={createLabel}
            onChange={(e) => setCreateLabel(e.target.checked)}
            style={{ marginLeft: "10px" }}
          />
        </label>

        {/* Activation Token Section */}
        <div
          style={{
            width: "100%",
            marginBottom: "1em",
            backgroundColor: "#333",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: "white" }}>Activation Token</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Index
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Class
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Product
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param1
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param2
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param3
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {actionRows.map((row, index) => {
                const func = funcRegistry.find((func) => func.id === row.id);
                const meta_data = func?.meta_data || {};
                const paramStyles = {
                  backgroundColor:
                    meta_data.optionalParams > 0 ? "#f0f0f0" : "white",
                };
                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        color: "white",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select Class</option>
                        <option value="AC">AC</option>
                        <option value="RD">RD</option>
                        <option value="UP">UP</option>
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) =>
                          handleRowChange(index, e, "activation")
                        }
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select ID</option>
                        {filteredFuncRegistry(row.class).map((func) => (
                          <option key={func.id} value={func.id}>
                            {func.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => openOverlay(index, "activation")}
                        style={{ width: "100%", color: "white" }}
                      >
                        {row.product.name ? row.product.name : "Select Product"}
                      </button>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[0]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param1"
                          value={row.param1}
                          onChange={(e) =>
                            handleRowChange(index, e, "activation")
                          }
                          placeholder="Param1"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[1]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param2"
                          value={row.param2}
                          onChange={(e) =>
                            handleRowChange(index, e, "activation")
                          }
                          placeholder="Param2"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[2]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param3"
                          value={row.param3}
                          onChange={(e) =>
                            handleRowChange(index, e, "activation")
                          }
                          placeholder="Param3"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index, "activation")}
                        style={{
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "5px 10px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => handleAddRow("activation")}
            style={{
              display: "block",
              margin: "20px auto",
              padding: "10px 20px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            +
          </button>
        </div>
        <label
          style={{ width: "100%", marginTop: "1px", marginBottom: "50px" }}
        >
          Summary:
          <textarea
            value={summary}
            readOnly
            style={{
              width: "100%",
              color: "black",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
            }}
          />
        </label>

        {/* Reduction Token Section */}
        <div
          style={{
            width: "100%",
            marginBottom: "1em",
            backgroundColor: "#333",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: "white" }}>Reduction Token</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Index
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Class
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Product
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param1
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param2
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param3
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {reductionRows.map((row, index) => {
                const func = funcRegistry.find((func) => func.id === row.id);
                const meta_data = func?.meta_data || {};
                const paramStyles = {
                  backgroundColor:
                    meta_data.optionalParams > 0 ? "#f0f0f0" : "white",
                };
                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        color: "white",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select Class</option>
                        <option value="CM">CM</option>
                        <option value="CMUP">CMUP</option>
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) => handleRowChange(index, e, "reduction")}
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select ID</option>
                        {filteredFuncRegistry(row.class).map((func) => (
                          <option key={func.id} value={func.id}>
                            {func.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => openOverlay(index, "reduction")}
                        style={{ width: "100%", color: "white" }}
                      >
                        {row.product.name ? row.product.name : "Select Product"}
                      </button>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[0]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param1"
                          value={row.param1}
                          onChange={(e) =>
                            handleRowChange(index, e, "reduction")
                          }
                          placeholder="Param1"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[1]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param2"
                          value={row.param2}
                          onChange={(e) =>
                            handleRowChange(index, e, "reduction")
                          }
                          placeholder="Param2"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[2]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param3"
                          value={row.param3}
                          onChange={(e) =>
                            handleRowChange(index, e, "reduction")
                          }
                          placeholder="Param3"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index, "reduction")}
                        style={{
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "5px 10px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => handleAddRow("reduction")}
            style={{
              display: "block",
              margin: "20px auto",
              padding: "10px 20px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            +
          </button>
        </div>
        <label
          style={{ width: "100%", marginTop: "1px", marginBottom: "50px" }}
        >
          Summary:
          <textarea
            value={reductionSummary}
            readOnly
            style={{
              width: "100%",
              color: "black",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
            }}
          />
        </label>

        {/* Shipment Token Section */}
        <div
          style={{
            width: "100%",
            marginBottom: "1em",
            backgroundColor: "#333",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ color: "white" }}>Shipment Token</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Index
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Class
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Product
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param1
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param2
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Param3
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: "white",
                  }}
                >
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {shipmentRows.map((row, index) => {
                const func = funcRegistry.find((func) => func.id === row.id);
                const meta_data = func?.meta_data || {};
                const paramStyles = {
                  backgroundColor:
                    meta_data.optionalParams > 0 ? "#f0f0f0" : "white",
                };
                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        color: "white",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="class"
                        value={row.class}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select Class</option>
                        <option value="SH">SH</option>
                        <option value="UP">UP</option>
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <select
                        name="id"
                        value={row.id}
                        onChange={(e) => handleRowChange(index, e, "shipment")}
                        style={{ width: "100%", color: "black" }}
                      >
                        <option value="">Select ID</option>
                        {filteredFuncRegistry(row.class).map((func) => (
                          <option key={func.id} value={func.id}>
                            {func.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => openOverlay(index, "shipment")}
                        style={{ width: "100%", color: "white" }}
                      >
                        {row.product.name ? row.product.name : "Select Product"}
                      </button>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[0]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param1"
                          value={row.param1}
                          onChange={(e) =>
                            handleRowChange(index, e, "shipment")
                          }
                          placeholder="Param1"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[1]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param2"
                          value={row.param2}
                          onChange={(e) =>
                            handleRowChange(index, e, "shipment")
                          }
                          placeholder="Param2"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <Tooltip
                        title={meta_data.optionalDesc?.[2]?.desc || ""}
                        arrow
                      >
                        <input
                          type="text"
                          name="param3"
                          value={row.param3}
                          onChange={(e) =>
                            handleRowChange(index, e, "shipment")
                          }
                          placeholder="Param3"
                          style={{
                            width: "100%",
                            color: "black",
                            ...paramStyles,
                          }}
                        />
                      </Tooltip>
                    </td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index, "shipment")}
                        style={{
                          backgroundColor: "red",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "5px 10px",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => handleAddRow("shipment")}
            style={{
              display: "block",
              margin: "20px auto",
              padding: "10px 20px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            +
          </button>
        </div>
        <label
          style={{ width: "100%", marginTop: "1px", marginBottom: "50px" }}
        >
          Summary:
          <textarea
            value={shipmentSummary}
            readOnly
            style={{
              width: "100%",
              color: "black",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleTestProduct}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            backgroundColor: "orange",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Test Product
        </button>
        <button
          type="button"
          onClick={handleCreateProduct}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Create Product
        </button>
      </form>
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
                style={{ width: "80%", color: "black" }}
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
                      backgroundColor: index % 2 === 0 ? "white" : "#d1d5db", // gray-300
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
