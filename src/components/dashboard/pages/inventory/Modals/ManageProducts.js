import React, { useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import NavBar from "./NavBar";
import LiquidTemplate from "./LiquidTemplate";
import PillLiquid from "./PillLiquid";
import CustomProduct from "./CustomProduct";
import EditProducts from "./EditProducts";

const http = new http_handler();

export default function ManageProducts(props) {
  const [navRoute, setNavRoute] = useState(0);
  // routes = 0 - liquid template product add, 1 - pill liquid product add, 2 - custom product add, 3 - edit products

  const renderContent = () => {
    switch (navRoute) {
      case 0:
        return <LiquidTemplate />;
      case 1:
        return <PillLiquid />;
      case 2:
        return <CustomProduct />;
      case 3:
        return <EditProducts />;
      default:
        return null;
    }
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Products"}
      closeName={"manage"}
    >
      <NavBar navRoute={navRoute} setNavRoute={setNavRoute} />
      <div className="relative overflow-hidden">
        <div className="transition-opacity duration-500 ease-in-out opacity-0">
          {renderContent()}
        </div>
      </div>
    </BaseModal>
  );
}
