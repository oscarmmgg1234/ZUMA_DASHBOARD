import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ReductionLog(props) {
  const [filteredReduction, setFilteredReduction] = useState([]);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0] 
  );

  const fetchReduction= async () => {
    const response = await http.getReductionbyDate({ date: filterDate }); // Assuming getShipments is a method in your http_handler
    setFilteredReduction(response.data);
  };

  useEffect(() => {
    fetchReduction();
  }, []);

  useEffect(() => {
    if (filterDate) {
      fetchReduction();
    }
  }, [filterDate]);

  const handleDateFilterChange = (e) => {
    setFilterDate(e.target.value);
  };

  
  const shipmentRows = filteredReduction.map((reduction, index) => (
    <tr key={reduction.CONSUMP_ID} className={index%2===0?"bg-white border":"bg-gray-200 border"}>
      <td className="px-4 py-2 text-black bg-rose-300">{reduction.PRODUCT_ID}</td>
      <td className="px-4 py-2 text-black">
        {reduction.PRODUCT_NAME ? reduction.PRODUCT_NAME : "N/A"}
      </td>
      <td className="px-4 py-2 text-black">{reduction.QUANTITY.toFixed(2)}</td>
      <td className="px-4 py-2 text-black">
        {new Date(reduction.DATETIME).toDateString()}
      </td>
      <td className="px-4 py-2 text-black">{"N/A"}</td>
      <td className="px-4 py-2 text-black">{reduction.EMPLOYEE_NAME ? reduction.EMPLOYEE_NAME : "N/A"}</td>
    </tr>
    
  ));

  return (
    <>
      <BaseModal
        visible={props.visible}
        closeHandler={props.closeHandler}
        title={"View Product Reductions"}
        closeName={"reduction"}
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
              {filteredReduction.length > 0 ?  
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
              <h1 className="text-black text-3xl">No Product Reductions for this date</h1>}
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
