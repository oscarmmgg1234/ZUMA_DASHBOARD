import React, { useEffect, useState } from "react";
import BaseModal from "./Base"


export default function ViewInventoryModal(props) {
    
    return (
        <>
        <BaseModal visible={props.visible} closeHandler={props.closeHandler} title={"View Inventory"}>
            
        </BaseModal>
        </>
    )

}