import React, { useEffect, useState } from "react";
import tw from "tailwind-styled-components";
import http_handler from "./HTTP/HTTPS_INTERFACE";
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
  //states modals

  //states
  const [topEmployee, setTopEmployee] = useState({});

  //handlers
  const closeHandler = (args) => {};

  const openHandler = (args) => {};

  const getTopEmployee = async () => {
    const topEmployee = await http.getTopEmployee();
    const topEmployeeData = topEmployee.data[0][0];
    setTopEmployee(topEmployeeData);
  };

  useEffect(() => {
    getTopEmployee();
  }, []);

  return (
    <>
      <CardGrid>
        <Card>
          <h2 className="text-black">Top Employee of the week: <h2 className="bg-orange-300 rounded-sm">{topEmployee.EMPLOYEE_NAME}</h2></h2>
          <SubComponent>
            <p className="text-black">With and outstanding consumption of: {topEmployee.EntryCount}</p>
          </SubComponent>
        </Card>
      </CardGrid>
    </>
  );
};

export default DashboardBody;
