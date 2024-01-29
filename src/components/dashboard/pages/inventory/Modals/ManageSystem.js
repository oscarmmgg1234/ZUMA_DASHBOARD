import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();


export default function ManageSystem(props){

    return (<>
         <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage System"}
      closeName={"system"}
    >

    </BaseModal>
    </>)


}