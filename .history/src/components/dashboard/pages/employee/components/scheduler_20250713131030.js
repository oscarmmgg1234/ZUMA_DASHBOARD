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
    day: "2-digit",
  }).format(new Date(date));
};

// Convert UTC to 'HH:00' in Pacific Time
const formatTimeToPacific = (utcTime) => {
  return (
    new Date(utcTime)
      .toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      .split(":")[0]
      .padStart(2, "0") + ":00"
  );
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
      console.log(
        "SHIFT_START changed:",
        date,
        current.SHIFT_START,
        original.SHIFT_START
      );
      const parsedDate = new Date(`${date}T12:00:00-08:00`);
      changes.push(() =>
        https.transform_shift({
          shiftOption: "start",
          e_id: employeeId,
          date: parsedDate,
          hours: getHourDiff(original.SHIFT_START, current.SHIFT_START),
        })
      );
    }

    // Check SHIFT_END
    if (current.SHIFT_END !== original.SHIFT_END) {
      const parsedDate = new Date(`${date}T12:00:00-08:00`);
      changes.push(() =>
        https.transform_shift({
          shiftOption: "end",
          e_id: employeeId,
          date: parsedDate,
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
  window.alert("✅ All changes processed successfully!");
  console.log("✅ All shift changes processed.");
};

const getDateRangeFor3MonthWindow = () => {
  const now = new Date();

  const start = new Date(now);
  start.setMonth(now.getMonth() - 3);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setMonth(now.getMonth() + 3);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString().split("T")[0], // "YYYY-MM-DD"
    endDate: end.toISOString().split("T")[0],
  };
};

const MyCalendar = ({ employee }) => {
  const [shiftData, setShiftData] = React.useState({});
  const [originalShiftData, setOriginalShiftData] = React.useState({});
  const fetchData = async () => {
    const { startDate, endDate } = getDateRangeFor3MonthWindow();

    const data = await https.getShiftLogs(employee.id, startDate, endDate);

    const formattedData = {};

    data.forEach((item) => {
      const key = formatDateToPacific(item.SHIFT_DATE); // 'YYYY-MM-DD'
      formattedData[key] = {
        SHIFT_START: formatTimeToPacific(item.SHIFT_START),
        SHIFT_END: formatTimeToPacific(item.SHIFT_END),
        VALID: item.VALID === 0,
      };
    });

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
    const original = originalShiftData?.[key] || {};
    const startChanged = shift.SHIFT_START !== original.SHIFT_START;
    const endChanged = shift.SHIFT_END !== original.SHIFT_END;
    const isOutOfScope = !shiftData[key];

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
          backgroundColor: weekend
            ? "#dcdcdcff"
            : shift.VALID
            ? "#83a090ff" // ← slightly darker shade when called off
            : "#abc0acff", // ← default
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
            <label style={{ color: "black" }}>Non-Business Day</label>
            <input
              type="time"
              style={{
                width: "100%",
                backgroundColor: "transparent", // or 'white' if needed
                border: "1px solid transparent",
                color: "transparent",
                outline: "none",
                fontWeight: "500",
                fontSize: "0.9rem",
                WebkitAppearance: "none", // removes default style in Chrome
                MozAppearance: "none",
                appearance: "none",
              }}
              disabled={true}
              value={"Weekend"}
            />
          </div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                top: 2,
                right: 2,
                zIndex: 1,
                opacity: isOutOfScope ? 0.5 : 1,
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingRight: "0.2rem",
                  paddingLeft: "0.2rem",
                  color: "rgba(76, 74, 45, 1)",
                }}
              >
                Called Off
                <input
                  style={{
                    marginLeft: "0.6rem",
                    backgroundColor: "#6c7f6f", // or 'white' if needed
                    border: "2px solid white",
                    width: "1.2rem",
                    height: "1.2rem",
                    color: "white",
                    padding: "4px 6px",
                    borderRadius: "4px",
                    outline: "none",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    WebkitAppearance: "none", // removes default style in Chrome
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                  type="checkbox"
                  checked={shift.VALID || false}
                  onChange={() => handleCheckbox(value)}
                  title="Called Off"
                  disabled={isOutOfScope}
                />
              </label>
            </div>
            <div style={{ padding: "0.25rem", width: "100%" }}>
              <input
                type="time"
                value={shift.SHIFT_START || ""}
                onChange={(e) => handleChange(value, "start", e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: "4px",
                  backgroundColor: startChanged ? "#fff3cd" : "#fefefe", // soft yellow
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  fontWeight: 500,
                  color: "#333",
                }}
                disabled={isOutOfScope}
              />

              <input
                type="time"
                value={shift.SHIFT_END || ""}
                onChange={(e) => handleChange(value, "end", e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: endChanged ? "#fff3cd" : "#fefefe", // soft yellow
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  fontWeight: 500,
                  color: "#333",
                }}
                disabled={isOutOfScope}
              />
            </div>
            {isOutOfScope == t ?  (
              <>
              <div
                style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}
              >
                🔒 Out of scope – Manager must update schedule
              </div>
              </>
            ) : (
              <></>
            )}
          </>
        )}
        {children}
      </div>
    );
  };

  return (
    <div style={{ height: "73vh", color: "black" }}>
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

        className="bg-emerald-900 hover:bg-emerald-800 text-white px-4 py-2 w-full "
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
