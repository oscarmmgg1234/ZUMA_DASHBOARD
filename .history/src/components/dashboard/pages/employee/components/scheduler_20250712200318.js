import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": require("date-fns/locale/en-US") };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MyCalendar = () => {
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
      <div style={{ position: "relative", height: "100%", backgroundColor: "#000000ff" }}>
        <div style={{ position: "relative", top: 2, right: 2, zIndex: 1 }}>
          <label>
            <input
            style={{ marginTop: "2rem", marginLeft: "0.25rem", }}
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
