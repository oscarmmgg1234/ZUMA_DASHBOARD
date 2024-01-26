import React, { useState } from "react";
import tw from "tailwind-styled-components";
import ViewInventoryModal from "./Modals/ViewInventory";
import ShipmentLog from "./Modals/ShipmentLog";

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
bg-gradient-to-br from-white to-gray-100
hover:to-gray-500
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
  const [viewInvModalVisible, setViewInvModalVisible] = useState(false);
  const [shipmentLogModalVisible, setShipmentLogModalVisible] = useState(false);

  const closeHandler = (args) => {
    if (args === "viewInv") {
      setViewInvModalVisible(false);
    }
    if (args === "shipment") {
      setShipmentLogModalVisible(false);
    }
  };

  const openHandler = (args) => {
    if (args === "viewInv") {
      setViewInvModalVisible(true);
    }
    if (args === "shipment") {
      setShipmentLogModalVisible(true);
    }
  };

  return (
    <>
      <CardGrid>
        <Card onClick={() => openHandler("viewInv")}>
          <h2 className="text-black mb-3">View Inventory</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View Inventory of all products in the database.
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("shipment")}>
          <h2 className="text-black mb-3">Shipment Product Log</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Allows you to update shipment stock quantity for product
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Product Activation Log</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View all logs of product activation
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Product Reduction Log</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View all logs of product reduction
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
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Manage Products</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">Manage products in the database</p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">System Analytics</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View analytics of the system and its components
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <h2 className="text-black mb-3">Manage System Info</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Manage system information such as name, address, etc.
            </p>
          </SubComponent>
        </Card>
      </CardGrid>

      <ViewInventoryModal
        visible={viewInvModalVisible}
        closeHandler={closeHandler}
      />
      <ShipmentLog
        visible={shipmentLogModalVisible}
        closeHandler={closeHandler}
      />
    </>
  );
}
