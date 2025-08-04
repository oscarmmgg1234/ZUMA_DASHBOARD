import React, { useEffect, useState } from "react";
import tw from "tailwind-styled-components";
import { FaTimes, FaPrint, FaEye } from "react-icons/fa";

const ModalBackground = tw.div`
  fixed
  z-50
  inset-0
  bg-gray-900
  opacity-50
`;

const ModalContainer = tw.div`
  fixed
  z-50
  top-1/2
  left-1/2
  transform
  -translate-x-1/2
  -translate-y-1/2
  w-3/4
  h-5/6
  bg-white
  rounded-md
  overflow-y-
`;

const ModalHeader = tw.div`
  flex
  justify-between
  items-center
  px-4
  py-2
  bg-gray-200
  border-b
  border-gray-400
`;

const ModalTitle = tw.h2`
  text-lg
  font-medium
`;

const ModalCloseButton = tw.button`
  focus:outline-none
  text-black
`;

export default function BaseModal(props) {
  return (
    <>
      {props.visible ? (
        <>
          <ModalBackground onClick={() => props.closeHandler(props.closeName)} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">{props.title}</ModalTitle>
              <ModalCloseButton onClick={() => props.closeHandler(props.closeName)}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            {/* body of modal */}
            {props.children}
          </ModalContainer>
        </>
      ) : null}{" "}
    </>
  );
}
