import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ShipmentLog(props) {
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0] 
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

  
  const shipmentRows = filteredShipments.map((shipment, index) => (
    <tr key={shipment.ID} className={index%2===0?"bg-white border":"bg-gray-200 border"}>
      <td className="px-4 py-2 text-black bg-rose-300">{shipment.PRODUCT_ID}</td>
      <td className="px-4 py-2 text-black">
        {shipment.PRODUCT_NAME ? shipment.PRODUCT_NAME : "N/A"}
      </td>
      <td className="px-4 py-2 text-black">{shipment.QUANTITY}</td>
      <td className="px-4 py-2 text-black">
        {new Date(shipment.SHIPMENT_DATE).toDateString()}
      </td>
      <td className="px-4 py-2 text-black">{shipment.COMPANY_ID}</td>
      <td className="px-4 py-2 text-black">{shipment.EMPLOYEE_NAME ? shipment.EMPLOYEE_NAME : "N/A"}</td>
    </tr>
    
  ));

  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"View Product Shipments"}
        closeName={"shipment"}
      >
        <div className="container mx-auto p-4">
          <input
            type="date"
            value={filterDate}
            onChange={handleDateFilterChange}
            className="mb-4 p-2 border rounded-lg text-black"
          />
          <div className="overflow-y-auto max-h-130 mx-auto">
            <table className="min-w-full border-collapse text-center">
              {filteredShipments.length > 0 ?  
                <>
              <thead className="bg-gray-400">
                <tr>
                  <th className="px-4 py-2 border text-black">Product ID</th>
                  <th className="px-4 py-2 border text-black">Product Name</th>
                  <th className="px-4 py-2 border text-black">Quantity</th>
                  <th className="px-4 py-2 border text-black">Date</th>
                  <th className="px-4 py-2 border text-black">Company ID</th>
                  <th className="px-4 py-2 border text-black">Employee</th>
                </tr>
              </thead>
              <tbody>{shipmentRows}</tbody> </> : 
              <h1 className="text-black text-3xl">No Shipments for this date</h1>}
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
