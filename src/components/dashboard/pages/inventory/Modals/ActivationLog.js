import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ActivationLog(props) {
  const [filteredActivation, setFilteredActivation] = useState([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0] 
  );

  const fetchActivation = async () => {
    const response = await http.getActivationByDate({ date: filterDate }); // Assuming getShipments is a method in your http_handler
    setFilteredActivation(response.data);
  };

  useEffect(() => {
    fetchActivation();
  }, []);

  useEffect(() => {
    if (filterDate) {
      fetchActivation();
    }
  }, [filterDate]);

  const handleDateFilterChange = (e) => {
    setFilterDate(e.target.value);
  };

  
  const activationRows = filteredActivation.map((activation, index) => (
    <tr key={activation.ACTIVATION_ID} className={index%2===0?"bg-white border":"bg-gray-200 border"}>
      <td className="px-4 py-2 text-black bg-rose-300">{activation.PRODUCT_ID}</td>
      <td className="px-4 py-2 text-black">
        {activation.PRODUCT_NAME ? activation.PRODUCT_NAME : "N/A"}
      </td>
      <td className="px-4 py-2 text-black">{activation.QUANTITY}</td>
      <td className="px-4 py-2 text-black">
        {new Date(activation.DATE).toDateString()}
      </td>
      <td className="px-4 py-2 text-black">{"N/A"}</td>
      <td className="px-4 py-2 text-black">{activation.EMPLOYEE_NAME ? activation.EMPLOYEE_NAME : "N/A"}</td>
    </tr>
    
  ));

  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"View activations"}
        closeName={"activation"}
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
              {filteredActivation.length > 0 ?  
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
              <tbody>{activationRows}</tbody> </> : 
              <h1 className="text-black text-3xl">No Product Activations for this date</h1>}
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
