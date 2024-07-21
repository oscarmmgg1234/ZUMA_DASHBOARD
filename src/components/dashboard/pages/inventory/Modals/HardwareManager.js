import React, { useState, useEffect } from "react";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import BaseModal from "./Base";
const http = new http_handler();

export default function HardwareManager(props) {
  const [scanners, setScanners] = useState([]);
  const [newScanner, setNewScanner] = useState({
    id: "",
    status: 0,
    type_desc: "Reduction Scanner",
    assigned_employee: null,
    label: "",
  });

  useEffect(() => {
    http.getScannerData().then((data) => {
      setScanners(data.scanners);
    });
  }, []);

  const deleteHardware = async (id) => {
    try {
      await http.deleteScanner(id);
    } catch (e) {
      console.log(e);
    }
    setScanners(scanners.filter((scanner) => scanner.id !== id));
  };

  const addHardware = async () => {
    try {
      await http.addScanner(newScanner);
    } catch (e) {
      console.log(e);
    }
    setScanners([...scanners, newScanner]);
    setNewScanner({
      id: "",
      status: 0,
      type_desc: "Reduction Scanner",
      assigned_employee: null,
      label: "",
    });
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Hardware"}
      closeName={"hardware"}
    >
      <div
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
          color: "black",
          padding: "20px",
          borderRadius: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "black",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  color: "black",
                  backgroundColor: "#f1f1f1",
                  borderRadius: "10px 0 0 0",
                }}
              >
                ID
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  color: "black",
                  backgroundColor: "#f1f1f1",
                }}
              >
                Status
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  color: "black",
                  backgroundColor: "#f1f1f1",
                }}
              >
                Type
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  color: "black",
                  backgroundColor: "#f1f1f1",
                }}
              >
                Assigned Employee
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  color: "black",
                  backgroundColor: "#f1f1f1",
                  borderRadius: "0 10px 0 0",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {scanners.map((scanner) => (
              <tr key={scanner.id}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    color: "black",
                  }}
                >
                  {scanner.id}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    color: "black",
                  }}
                >
                  {scanner.status === 0 ? "Disconnected" : "Connected"}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    color: "black",
                  }}
                >
                  {scanner.type_desc}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    color: "black",
                  }}
                >
                  {scanner.assigned_employee || "N/A"}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "12px",
                    color: "black",
                  }}
                >
                  <button
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "5px",
                    }}
                    onClick={() => deleteHardware(scanner.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={{ color: "black", marginBottom: "20px" }}>
          Add New Scanner
        </h3>
        <input
          style={{
            padding: "10px",
            margin: "10px 0",
            width: "100%",
            boxSizing: "border-box",
            color: "black",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          type="text"
          placeholder="ID"
          value={newScanner.id}
          onChange={(e) => setNewScanner({ ...newScanner, id: e.target.value })}
        />
        <input
          style={{
            padding: "10px",
            margin: "10px 0",
            width: "100%",
            boxSizing: "border-box",
            color: "black",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          type="number"
          placeholder="Status"
          value={newScanner.status}
          onChange={(e) =>
            setNewScanner({ ...newScanner, status: parseInt(e.target.value) })
          }
        />
        <input
          style={{
            padding: "10px",
            margin: "10px 0",
            width: "100%",
            boxSizing: "border-box",
            color: "black",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          type="text"
          placeholder="Type"
          value={newScanner.type_desc}
          onChange={(e) =>
            setNewScanner({ ...newScanner, type_desc: e.target.value })
          }
        />
        <input
          style={{
            padding: "10px",
            margin: "10px 0",
            width: "100%",
            boxSizing: "border-box",
            color: "black",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          type="text"
          placeholder="Assigned Employee"
          value={newScanner.assigned_employee || ""}
          onChange={(e) =>
            setNewScanner({
              ...newScanner,
              assigned_employee: e.target.value,
            })
          }
        />
        <input
          style={{
            padding: "10px",
            margin: "10px 0",
            width: "100%",
            boxSizing: "border-box",
            color: "black",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          type="text"
          placeholder="Label"
          value={newScanner.label}
          onChange={(e) =>
            setNewScanner({ ...newScanner, label: e.target.value })
          }
        />
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
            marginTop: "10px",
          }}
          onClick={addHardware}
        >
          Add
        </button>
      </div>
    </BaseModal>
  );
}
