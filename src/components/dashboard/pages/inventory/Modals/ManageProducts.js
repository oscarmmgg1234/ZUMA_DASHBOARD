'use client';

import React, { useState } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
import CustomProduct from "./manageProdSubViews/CustomProduct";
import EditView from "./manageProdSubViews/EditProducts";
import EditTokens from "./manageProdSubViews/EditTokens";
import Navbar from "./manageProdSubViews/Navbar";

const http = new http_handler();

export default function ManageProducts(props) {
  const [navRoute, setNavRoute] = useState(0);

  const renderContent = () => {
    switch (navRoute) {
      case 2:
        return <EditTokens api={http} />;
      case 1:
        return <CustomProduct api={http} />;
      case 0:
        return <EditView api={http} />;
      default:
        return <EditView api={http} />;
    }
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Products"}
      closeName={"manage"}
    >
      <div className="relative h-full flex flex-col">
        <div className="fixed w-full z-10">
          <Navbar currentRoute={navRoute} onRouteChange={setNavRoute} />
        </div>
        <div className="flex-1 mt-24 overflow-y-auto p-4">
          {renderContent()}
        </div>
      </div>
    </BaseModal>
  );
}
