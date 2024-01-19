import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ShipmentLog(props) {
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [filterDate, setFilterDate] = useState(
    Date.now().toString().split("T")[0]
  );

  const fetchShipments = async () => {
    const response = await http.getShipmentByDate({ date: filterDate }); // Assuming getShipments is a method in your http_handler
    setFilteredShipments(response.data);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (filterDate) {
      fetchShipments();
    }
  }, [filterDate]);

  const handleDateFilterChange = (e) => {
    setFilterDate(e.target.value);
  };

  const shipmentRows = filteredShipments.map((shipment) => (
    <tr key={shipment.ID} className="bg-white border">
      <td className="px-4 py-2 text-black">{shipment.PRODUCT_ID}</td>
      <td className="px-4 py-2 text-black">
        {shipment.PRODUCT_NAME ? shipment.PRODUCT_NAME : "N/A"}
      </td>
      <td className="px-4 py-2 text-black">{shipment.QUANTITY}</td>
      <td className="px-4 py-2 text-black">
        {new Date(shipment.SHIPMENT_DATE).toDateString()}
      </td>
      <td className="px-4 py-2 text-black">{shipment.COMPANY_ID}</td>
      <td className="px-4 py-2 text-black">{shipment.EMPLOYEE_ID}</td>
    </tr>
  ));

  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"View Shipments"}
        closeName={"shipment"}
      >
        <div className="container mx-auto p-4">
          <input
            type="date"
            value={filterDate}
            onChange={handleDateFilterChange}
            className="mb-4 p-2 border rounded-lg text-black"
          />
          <div className="overflow-y-auto max-h-96 mx-auto">
            <table className="min-w-full border-collapse text-center">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-4 py-2 border text-black">Product ID</th>
                  <th className="px-4 py-2 border text-black">Product Name</th>
                  <th className="px-4 py-2 border text-black">Quantity</th>
                  <th className="px-4 py-2 border text-black">Date</th>
                  <th className="px-4 py-2 border text-black">Company ID</th>
                  <th className="px-4 py-2 border text-black">Employee ID</th>
                </tr>
              </thead>
              <tbody>{shipmentRows}</tbody>
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
