import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement } from "chart.js";
Chart.register(ArcElement);

const options = {
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed !== null) {
            label += `${context.parsed} units`; // Assuming 'units' is your measurement
          }
          return label;
        },
      },
    },
    legend: {
      display: true,
      position: "top",
      labels: {
        usePointStyle: true,
      },
    },
  },
};

const PieChart = ({ data }) => {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: [
          // Add as many colors as you have data points
          "rgb(255, 205, 86)",
          "rgb(227, 61, 148)",
          // ...
        ],
        hoverOffset: 4,
        hoverBackgroundColor: [
          // Add as many colors as you have data points
          "rgb(255, 200, 70)",
          "rgb(227, 55, 130)",
          // ...
        ],
      },
    ],
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;
