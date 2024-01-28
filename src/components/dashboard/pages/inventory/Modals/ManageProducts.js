import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ManageProducts(props) {

    const [action, setAction] = useState(false);
    
  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Products"}
      closeName={"manage"}
    >
    <div className="h-full w-full">
        <button onClick={()=>setAction(!action)} className="w-32 h-24 bg-orange-300">
            <p className="text-xs">Click to toggle</p>
            <p className="font-bold">{action ? "Add Product" : "Delete Product"}</p>
        </button>
        <div>
            <input type="text" placeholder="Product Name" className="w-48 h-16"/>
        </div>
    </div>
    </BaseModal>
  );
}
