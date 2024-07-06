import React, { useEffect, useState } from "react";
import tw from "tailwind-styled-components";
import http_handler from "./HTTP/HTTPS_INTERFACE";
import { ChartComponent } from "./Components/Charts";
import {
  isWeekend,
  format,
  isSameDay,
  subBusinessDays,
  subDays,
  set,
} from "date-fns";

const http = new http_handler();

const Overlay = tw.div`
  z-20
  top-0
  left-0
  w-full
  h-full
  flex
  flex-col
  items-center
  justify-center
  bg-gray-900
  opacity-90
`;

const Blur = tw.div`
  text-6xl
  text-white
  font-bold
  text-center
  text-opacity-25
  backdrop-blur-lg
`;

const RedBar = tw.div`
  fixed
  z-10
  bottom-0
  left-0
  w-full
  h-20
  bg-red-500
  opacity-75
`;

const AlertCardGrid = tw.div`
  mt-20
  grid
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  gap-4
  px-4 py-6
`;

const AlertCard = tw.div`
  bg-white
  shadow-md
  rounded-md
  p-4
`;

const CardGrid = tw.div`
  grid
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  gap-4
  px-4 py-6
`;

const Card = tw.div`
  bg-white
  shadow-md
  rounded-md
  p-4
`;

const SubComponent = tw.div`
  bg-gray-100
  rounded-md
  p-4
`;

const DashboardBody = () => {
  const [metrics, setMetrics] = useState({});
  const [employeeMetrics, setEmployeeMetrics] = useState(null);
  const [globalMetrics, setGlobalMetrics] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeChartData, setEmployeeChartData] = useState(null);

  const getMetrics = async () => {
    const metrics = await http.getMetrics();
    setMetrics(metrics);
  };

  const getEmployeeMetrics = async () => {
    //this is weekly data, so we need to get the data for the current week excuding weekends and last week
    const weeklystart = currentDate;
    let weeklyend = currentDate;
    const getDay = currentDate.getDay();
    if (getDay === 0) {
      weeklyend = subDays(currentDate, 6);
    }
    if (getDay === 6) {
      weeklyend = subDays(currentDate, 5);
    }
    if (getDay === 1) {
      weeklyend = currentDate;
    } else {
      weeklyend = subDays(currentDate, getDay - 1);
    }

    const metrics = await http.getMetricsHistory(
      [format(weeklyend, "yyyy-MM-dd"), format(weeklystart, "yyyy-MM-dd")],
      "employee"
    );
    if (metrics.length === 0) {
      setEmployeeMetrics([]);
      return;
    }
    let temp = new Map(
      metrics.map((item) => [
        item.date,
        new Map(
          item.employeeMetrics.map((item) => [item.employeeId, item.perMonth])
        ),
      ])
    );

    //use a map for quick iteration to get the employee data
    // const employee = temp.get("2024-07-05").get("000002");
    setEmployeeMetrics(temp);
  };

  const formatEmployeeMetrics = (employeeID) => {
    let chartData = [];
    let total = 0;
    for (let [key, value] of employeeMetrics) {
      const employeeEntry = employeeMetrics.get(key).get(employeeID);
      for (const entry of employeeEntry) {
        total += parseFloat(entry.total);
      }
      chartData.push({
        date: key,
        value: total.toFixed(1),
      });
      total = 0;
    }
    setEmployeeChartData(chartData);
  };

  useEffect(() => {
    const init = async () => {
      await getMetrics();
      await getEmployeeMetrics();
      formatEmployeeMetrics("000002");
    };
    init();
  }, []);
  const closeHandler = (args) => {};

  const openHandler = (args) => {};

  return (
    <>
      <CardGrid>
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 lg:row-span 3 md:row-span-3 xl:row-span-3">
          <h2 className="text-black">
            <h2 className="rounded-sm">Employee Reduction Analysis (Weekly)</h2>
          </h2>
          <SubComponent>
            <p className="text-black">TEMP</p>
          </SubComponent>
          <SubComponent>
            <p>employee selection</p>
          </SubComponent>
          <SubComponent>product selection</SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Store Reductions Per Hour</h2>
          <SubComponent>
            <p
              className="text-black text-2xl "
              style={{ display: "flex", alignItems: "baseline" }}
            >
              {metrics.perHourWholeStore?.perMonth.toFixed(1)}{" "}
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "rgba(0,0,0,0.6)",
                  marginLeft: 7,
                }}
              >
                Units/PerHour
              </p>
            </p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 2</h2>
          <SubComponent>
            <p className="text-black">Content for card 2</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
        <Card>
          <h2 className="text-black">Card 3</h2>
          <SubComponent>
            <p className="text-black">Content for card 3</p>
          </SubComponent>
        </Card>
      </CardGrid>
    </>
  );
};

export default DashboardBody;
