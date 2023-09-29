import React from "react";
import tw from "tailwind-styled-components";
import Chart from "chart.js";

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

export default function Inventory() {
  return (
    <>
      <CardGrid>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">View Inventory</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View Inventory of all products in the database.
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Label Generator</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Generate labels for products in the database.
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Product Storage Schematic</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Display where product is stored in the warehouse, whether in
              active status or passive status(meaning its in garage)
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Shipment</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Allows you to update shipment stock quantity for product
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Predict Product Quantity</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Predicts the quantity of product needed for a given time period
            </p>
          </SubComponent>
        </Card>
      </CardGrid>
    </>
  );
}
