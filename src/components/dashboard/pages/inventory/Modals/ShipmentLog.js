import React, { useEffect, useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const http = new http_handler();

export default function ShipmentLog(props) {
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date());
  const [highlightedDates, setHighlightedDates] = useState([]);

  const convertToServerDate = (date) => {
    // Convert the date to the Los Angeles timezone
    const options = {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const laDate = new Intl.DateTimeFormat("en-US", options).format(date);

    const [month, day, year] = laDate.split("/");
    return `${year}-${month}-${day}`;
  };

  const fetchShipments = async (date) => {
    const formattedDate = convertToServerDate(date);
    const response = await http.getShipmentByDate({ date: formattedDate });
    setFilteredShipments(response.data);
  };

  const fetchTrimesterShipments = async () => {
    const response = await http.getPastYearShipments();
    
    setHighlightedDates(response.data.map((shipment) => new Date(shipment)));
  };

  useEffect(() => {
    fetchShipments(filterDate);
    fetchTrimesterShipments();
  }, []);

  useEffect(() => {
    if (filterDate) {
      fetchShipments(filterDate);
    }
  }, [filterDate]);

  const handleDateFilterChange = (date) => {
    setFilterDate(date);
    fetchShipments(date);
  };

  const shipmentRows = filteredShipments.map((shipment, index) => (
    <tr
      key={shipment.ID}
      className={index % 2 === 0 ? "bg-white border" : "bg-gray-200 border"}
    >
      <td className="px-4 py-2 text-black bg-rose-300">
        {shipment.PRODUCT_ID}
      </td>
      <td className="px-4 py-2 text-black">
        {shipment.PRODUCT_NAME ? shipment.PRODUCT_NAME : "N/A"}
      </td>
      <td className="px-4 py-2 text-black">{shipment.QUANTITY}</td>
      <td className="px-4 py-2 text-black">
        {new Date(shipment.SHIPMENT_DATE).toLocaleDateString("en-US", {
          timeZone: "America/Los_Angeles",
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-2 text-black">{shipment.COMPANY_ID}</td>
      <td className="px-4 py-2 text-black">
        {shipment.EMPLOYEE_NAME ? shipment.EMPLOYEE_NAME : "N/A"}
      </td>
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
          <DatePicker
            selected={filterDate}
            onChange={handleDateFilterChange}
            highlightDates={highlightedDates}
            className="mb-4 p-2 border rounded-lg text-black"
            dateFormat="yyyy-MM-dd"
          />
          <div className="overflow-y-auto max-h-130 mx-auto">
            <table className="min-w-full border-collapse text-center">
              {filteredShipments.length > 0 ? (
                <>
                  <thead className="bg-gray-400">
                    <tr>
                      <th className="px-4 py-2 border text-black">
                        Product ID
                      </th>
                      <th className="px-4 py-2 border text-black">
                        Product Name
                      </th>
                      <th className="px-4 py-2 border text-black">Quantity</th>
                      <th className="px-4 py-2 border text-black">Date</th>
                      <th className="px-4 py-2 border text-black">
                        Company ID
                      </th>
                      <th className="px-4 py-2 border text-black">Employee</th>
                    </tr>
                  </thead>
                  <tbody>{shipmentRows}</tbody>
                </>
              ) : (
                <h1 className="text-black text-3xl">
                  No Shipments for this date
                </h1>
              )}
            </table>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
