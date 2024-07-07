import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = ({ data, options }) => {
  const chartData = {
    datasets: data,
  };

  const defaultOptions = {
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          displayFormats: {
            day: "MMM d", // Display format for dates
          },
        },
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text: "Reductions / Hour",
        },
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Line data={chartData} options={mergedOptions} />
    </div>
  );
};

export default ChartComponent;
