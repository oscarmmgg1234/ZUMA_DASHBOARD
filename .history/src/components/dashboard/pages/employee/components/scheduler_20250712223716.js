import React from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import http_handler from "../Fetch/HTTPS_INTERFACE";
import { set } from "date-fns";
const https = new http_handler();
const locales = { "en-US": require("date-fns/locale/en-US") };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
// Format 'YYYY-MM-DD' in Pacific Time
const formatDateToPacific = (date) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
};

// Convert UTC to 'HH:00' in Pacific Time
const formatTimeToPacific = (utcTime) => {
  return new Date(utcTime).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  }).split(":")[0].padStart(2, "0") + ":00";
};

// Convert server response to local format
const toLocalShiftData = (serverDataArray) => {
  const result = {};
  for (const entry of serverDataArray) {
    const dateKey = formatDateToPacific(entry.SHIFT_DATE);
    result[dateKey] = {
      SHIFT_START: formatTimeToPacific(entry.SHIFT_START),
      SHIFT_END: formatTimeToPacific(entry.SHIFT_END),
      calledOff: entry.VALID === 0,
    };
  }
  return result;
};

// Get hour difference between times
const getHourDiff = (oldTime, newTime) => {
  const [oldHour] = oldTime.split(":").map(Number);
  const [newHour] = newTime.split(":").map(Number);
  return newHour - oldHour;
};

const processShiftChanges = async (
  shiftData,
  originalShiftData,
  employeeId
) => {
  const changes = [];

  for (const date in shiftData) {
    const current = shiftData[date];
    const original = originalShiftData[date];
    if (!original) continue;

    // Check SHIFT_START
    if (current.SHIFT_START !== original.SHIFT_START) {
      changes.push(() =>
        transform_shift({
          shiftOption: "start",
          e_id: employeeId,
          date,
          hours: getHourDiff(original.SHIFT_START, current.SHIFT_START),
        })
      );
    }

    // Check SHIFT_END
    if (current.SHIFT_END !== original.SHIFT_END) {
      changes.push(() =>
        https.transform_shift({
          shiftOption: "end",
          e_id: employeeId,
          date,
          hours: getHourDiff(original.SHIFT_END, current.SHIFT_END),
        })
      );
    }

    // Check calledOff → only send if changed
    if (current.VALID !== original.VALID) {
        const parsedDate = new Date(`${date}T12:00:00-08:00`); 
            
      changes.push(() =>
        https.removeShift({
          e_id: employeeId,
          date: parsedDate,
          revert: !current.VALID, // true = restore, false = remove
        })
      );
    }
  }

  for (const call of changes) {
    try {
      await call();
    } catch (err) {
      console.error("❌ Failed to process change:", err);
    }
  }

  console.log("✅ All shift changes processed.");
};



const MyCalendar = ({ employee }) => {
    const [shiftData, setShiftData] = React.useState({});
    const [originalShiftData, setOriginalShiftData] = React.useState({});
    const fetchData = async () => {
      const data = await https.getShiftLogs(
        employee.id,
        "2025-01-01",
        "2025-12-31"
      );

      const formattedData = {};

      data.forEach((item) => {
        const key = formatDateToPacific(item.SHIFT_DATE); // e.g., '2025-07-15'
        formattedData[key] = {
          SHIFT_START: formatTimeToPacific(item.SHIFT_START), // e.g., '07:00'
          SHIFT_END: formatTimeToPacific(item.SHIFT_END), // e.g., '15:00'
          VALID: !item.VALID,
        };
      });

      console.log("shiftData:", formattedData);
      setShiftData(formattedData);
      setOriginalShiftData(formattedData);
    };
  React.useEffect(() => {
    fetchData();

  }, [employee]);

  const handleChange = (date, type, value) => {
    const key = date.toISOString().split("T")[0];
    const shiftType = type === "start" ? "SHIFT_START" : "SHIFT_END";

    // Extract only hour, ignore minutes
    const [hour] = value.split(":");
    const normalizedTime = `${hour.padStart(2, "0")}:00`;

    setShiftData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [shiftType]: normalizedTime,
      },
    }));
  };


const handleCheckbox = (date) => {
  const key = date.toISOString().split("T")[0];
  setShiftData((prev) => ({
    ...prev,
    [key]: {
      ...prev[key],
      VALID: !prev[key]?.VALID,
    },
  }));
};
const isWeekend = (date) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

const CustomDateCellWrapper = ({ children, value }) => {
  const key = value.toISOString().split("T")[0];
  const shift = shiftData[key] || {};

  const isWeekend = (date) => {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  };

  const weekend = isWeekend(value);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        backgroundColor: weekend ? "#f4f4f4" : "#ffffff",
        color: "black",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: weekend ? "center" : "flex-start",
        fontSize: weekend ? "0.75rem" : "inherit",
        fontWeight: weekend ? 500 : "normal",
        padding: "0.25rem",
        textAlign: "center",
      }}
    >
      {weekend ? (
        <div style={{ padding: "0.25rem", width: "100%", marginTop: "30px" }}>
          <input
            type="time"
            style={{ width: "100%" }}
            disabled={true}
            value={"Weekend"}
          />
         
        </div>
      ) : (
        <>
          <div style={{ position: "relative", top: 2, right: 2, zIndex: 1 }}>
            <label
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.5rem",
                paddingRight: "0.2rem",
                paddingLeft: "0.2rem",

              }}
            >
              called off
              <input
              style={{ marginLeft: "0.6rem" }}
                type="checkbox"
                checked={shift.VALID|| false}
                onChange={() => handleCheckbox(value)}
                title="Called Off"
              />
            </label>
          </div>
          <div style={{ padding: "0.25rem", width: "100%" }}>
            <input
              type="time"
              value={shift.SHIFT_START || ""}
              onChange={(e) => handleChange(value, "start", e.target.value)}
              style={{ width: "100%" }}
            />
            <input
              type="time"
              value={shift.SHIFT_END || ""}
              onChange={(e) => handleChange(value, "end", e.target.value)}
              style={{ width: "100%", marginTop: "4px" }}
            />
          </div>
        </>
      )}
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
     <button
       onClick={() => {
         processShiftChanges(shiftData, originalShiftData, employee.id);
       }}
     >
       Save Changes
     </button>
   </div>
 );

};

export default MyCalendar;
