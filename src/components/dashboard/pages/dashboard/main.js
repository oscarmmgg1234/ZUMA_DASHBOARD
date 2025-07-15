// DashboardBody.js
import React, { useEffect, useState, Suspense } from "react";
import tw from "tailwind-styled-components";
import http_handler from "./HTTP/HTTPS_INTERFACE";
import ChartComponent from "./Components/employeeChart";
import TopProductsChart from "./Components/GlobalChart";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

const http = new http_handler();

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
  const [chartEmployeeData, setEmployeeChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const getMetrics = async () => {
    const metrics = await http.getMetrics();
    console.log("Fetched metrics:", metrics);
    setMetrics(metrics);
  };

  const getEmployeeMetrics = async () => {
    const weeklyStart = currentDate;
    let weeklyEnd = currentDate;
    const getDay = currentDate.getDay();

    if (getDay === 0) {
      weeklyEnd = subDays(currentDate, 6);
    } else if (getDay === 6) {
      weeklyEnd = subDays(currentDate, 5);
    } else if (getDay === 1) {
      weeklyEnd = currentDate;
    } else {
      weeklyEnd = subDays(currentDate, getDay - 1);
    }

    const metrics = await http.getMetricsHistory(
      [format(weeklyEnd, "yyyy-MM-dd"), format(weeklyStart, "yyyy-MM-dd")],
      "employee"
    );
    console.log("Fetched employee metrics:", metrics);
    setEmployeeChartData(metrics.chartReadyData);
    setTopProducts(metrics.productChartData);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await getMetrics();
      await getEmployeeMetrics();
      setLoading(false);
    };
    init();
  }, [currentDate]);

  return (
    <>
      <CardGrid>
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 lg:row-span 3 md:row-span-3 xl:row-span-3">
          <h2 className="text-black">
            <h2 className="rounded-sm">Employee Reduction Analysis (Weekly)</h2>
          </h2>
          <SubComponent style={{ height: "94%" }}>
            <Suspense fallback={<p style={{ color: "grey" }}>loading...</p>}>
              {!loading && (
                <ChartComponent
                  data={chartEmployeeData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              )}
            </Suspense>
          </SubComponent>
        </Card>
        {/* <Card>
          <h2 className="text-black">Store Reductions Per Hour</h2>
          <SubComponent>
            <p
              className="text-black text-2xl "
              style={{ display: "flex", alignItems: "baseline" }}
            >
              {"N/A"}{" "}
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
        </Card> */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 lg:row-span 3 md:row-span-3 xl:row-span-3">
          <h2 className="text-black">Top 5 Products Today</h2>
          <SubComponent
            style={{ height: "94%", width: "100%", paddingLeft: 10 }}
          >
            <Suspense fallback={<p style={{ color: "grey" }}>loading...</p>}>
              {!loading && <TopProductsChart data={topProducts} />}
            </Suspense>
          </SubComponent>
        </Card>
      </CardGrid>
    </>
  );
};

export default DashboardBody;
