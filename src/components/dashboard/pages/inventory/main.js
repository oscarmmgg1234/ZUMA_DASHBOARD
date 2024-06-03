import React, { useState } from "react";
import tw from "tailwind-styled-components";
import ViewInventoryModal from "./Modals/ViewInventory";
import ShipmentLog from "./Modals/ShipmentLog";
import ActivationLog from "./Modals/ActivationLog";
import ReductionLog from "./Modals/ReductionLog";
import ManageProducts from "./Modals/ManageProducts";
import OverrideStock from "./Modals/OverrideStock";
import ManageSystem from "./Modals/ManageSystem";
import ProductTracking from "./Modals/ProductTracking";
import SetGlobalGlycerin from "./Modals/SetGlobalGlycerin";

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
  const [activationLogModalVisible, setActivationLogModalVisible] =
    useState(false);
  const [reductionLogModalVisible, setReductionLogModalVisible] =
    useState(false);
  const [manageLogModalVisible, setManageLogModalVisible] = useState(false);
  const [overrrideLogModalVisible, setOverrideLogModalVisible] =
    useState(false);
  const [systemModalVisible, setSystemModalVisible] = useState(false);
  const [productTrackingModalVisible, setProductTrackingModalVisible] =
    useState(false);
  const [GlobalGlycerinModalVisible, setGlobalGlycerinModalVisible] =
    useState(false);

  const closeHandler = (args) => {
    if (args === "viewInv") {
      setViewInvModalVisible(false);
    }
    if (args === "shipment") {
      setShipmentLogModalVisible(false);
    }
    if (args === "activation") {
      setActivationLogModalVisible(false);
    }
    if (args === "reduction") {
      setReductionLogModalVisible(false);
    }
    if (args === "manage") {
      setManageLogModalVisible(false);
    }
    if (args === "manual") {
      setOverrideLogModalVisible(false);
    }
    if (args === "system") {
      setSystemModalVisible(false);
    }
    if (args === "tracking") {
      setProductTrackingModalVisible(false);
    }
    if (args === "GlobalGlycerin") {
      setGlobalGlycerinModalVisible(false);
    }
  };

  const openHandler = (args) => {
    if (args === "viewInv") {
      setViewInvModalVisible(true);
    }
    if (args === "shipment") {
      setShipmentLogModalVisible(true);
    }
    if (args === "activation") {
      setActivationLogModalVisible(true);
    }
    if (args === "reduction") {
      setReductionLogModalVisible(true);
    }
    if (args === "manage") {
      setManageLogModalVisible(true);
    }
    if (args === "manual") {
      setOverrideLogModalVisible(true);
    }
    if (args === "system") {
      setSystemModalVisible(true);
    }
    if (args === "tracking") {
      setProductTrackingModalVisible(true);
    }
    if (args === "GlobalGlycerin") {
      setGlobalGlycerinModalVisible(true);
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
        <Card onClick={() => openHandler("activation")}>
          <h2 className="text-black mb-3">Product Activation Log</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View all logs of product activation
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("reduction")}>
          <h2 className="text-black mb-3">Product Reduction Log</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View all logs of product reduction
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <div className="h-30 bg-black bg-opacity-70 flex justify-center items-center text-white">
            Update Coming Soon
          </div>

          <h2 className="text-black mb-3">Predict Product Quantity</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Predicts the quantity of product needed for a given time period
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("manage")}>
          <div className="h-30 bg-black bg-opacity-70 flex justify-center items-center text-white">
            Update Coming Soon
          </div>
          <h2 className="text-black mb-3">Manage Products</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">Manage products in the database</p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("manual")}>
          <h2 className="text-black mb-3">Manual Stock Override</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Manually adjust stock for product
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("tracking")}>
          <h2 className="text-black mb-3">Product Tracking</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Allows you to specify mininimum amount limits for products
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <div className="h-30 bg-black bg-opacity-70 flex justify-center items-center text-white">
            Update Coming Soon
          </div>
          <h2 className="text-black mb-3">Manage Partnered Companies</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Manage partnered companies, add or delete them.
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => openHandler("GlobalGlycerin")}>
          <h2 className="text-black mb-3">Global Glycerin</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Set the global glycerin unit for system
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => {}}>
          <div className="h-30 bg-black bg-opacity-70 flex justify-center items-center text-white">
            Update Coming Soon
          </div>
          <h2 className="text-black mb-3">System Analytics</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View analytics of the system and its components
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
      <ActivationLog
        visible={activationLogModalVisible}
        closeHandler={closeHandler}
      />
      <ReductionLog
        visible={reductionLogModalVisible}
        closeHandler={closeHandler}
      />
      <ManageProducts
        visible={manageLogModalVisible}
        closeHandler={closeHandler}
      />
      <OverrideStock
        visible={overrrideLogModalVisible}
        closeHandler={closeHandler}
      />
      <ManageSystem visible={systemModalVisible} closeHandler={closeHandler} />
      <ProductTracking
        visible={productTrackingModalVisible}
        closeHandler={closeHandler}
      />
      <SetGlobalGlycerin
        visible={GlobalGlycerinModalVisible}
        closeHandler={closeHandler}
      />
    </>
  );
}
