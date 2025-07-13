import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import http_handler from "../Fetch/HTTPS_INTERFACE";
const https = new http_handler();
const locales = { "en-US": require("date-fns/locale/en-US") };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MyCalendar = ({ employee }) => {
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await https.getShiftLogs(employee.id, "2025-01-01", "2025-12-31");
      console.log("Shift logs fetched:", data);
    };
    fetchData();
  }, [employee]);
  const [shiftData, setShiftData] = React.useState({});

  const handleChange = (date, type, value) => {
    const key = date.toISOString().split("T")[0];
    setShiftData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value,
      },
    }));
  };

  const handleCheckbox = (date) => {
    const key = date.toISOString().split("T")[0];
    setShiftData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        calledOff: !prev[key]?.calledOff,
      },
    }));
  };

  const CustomDateCellWrapper = ({ children, value }) => {
    const key = value.toISOString().split("T")[0];
    const shift = shiftData[key] || {};

    return (
      <div
        style={{
          position: "relative",
          height: "100%",
          backgroundColor: "#7a7a7a31",
        }}
      >
        <div style={{ position: "relative", top: 2, right: 2, zIndex: 1 }}>
          <label
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-around",
              marginTop: "1.5rem",
              marginLeft: "0.25rem",
              paddingRight: "1rem",
              paddingLeft: "1rem",
            }}
          >
            called off
            <input
              style={{}}
              type="checkbox"
              checked={shift.calledOff || false}
              onChange={() => handleCheckbox(value)}
              title="Called Off"
            />
          </label>
        </div>
        <div style={{ padding: "0.25rem" }}>
          <input
            type="time"
            value={shift.start || ""}
            onChange={(e) => handleChange(value, "start", e.target.value)}
            style={{ width: "100%" }}
          />
          <input
            type="time"
            value={shift.end || ""}
            onChange={(e) => handleChange(value, "end", e.target.value)}
            style={{ width: "100%", marginTop: "4px" }}
          />
        </div>
        {children}
      </div>
    );
  };

 return (
   <div style={{ height: "62vh", color: "black" }}>
     <Calendar
        
       onRangeChange={(range) => {
        let start = range.start;
         let end = range.end;
         console.log("Range changed:", start, end);

       }}
       localizer={localizer}
       defaultView="month"
       views={["month"]}
       components={{
         dateCellWrapper: CustomDateCellWrapper,
       }}
       style={{
         height: "100%",
         backgroundColor: "white",
         color: "black",
       }}
     />
   </div>
 );

};

export default MyCalendar;
