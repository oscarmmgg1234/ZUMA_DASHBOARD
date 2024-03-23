import React, { useEffect, useState } from "react";
import BaseModal from "../Modals/Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";

const http = new http_handler();

export default function SetGlobalGlycerin({ visible, closeHandler }) {
  const [glycerinData, setGlycerinData] = useState(null);
  const [newGlycerin, setNewGlycerin] = useState(1);

 const fetchGlobalGlycerin = async () => {
      try {
        const result = await http.getGlobalGlycerin();
        setGlycerinData(result.data.glycerinGlobalUnit);
      } catch (error) {
        console.error("Failed to fetch global glycerin:", error);
        // Handle the error state as needed
      }
    };
  useEffect(() => {
    fetchGlobalGlycerin();
  }, []);

  const updateGlycerin = async () => {
    if(newGlycerin == glycerinData || newGlycerin == 0){
        return;
    }
    await http.setGlobalGlycerin({ set_value: newGlycerin });
    setNewGlycerin(1);
    alert("Glycerin unit updated successfully");
    setTimeout(() => {fetchGlobalGlycerin();}, 200)
  };

  return (
    <BaseModal
      visible={visible}
      closeHandler={closeHandler}
      title="Set Global Glycerin"
      closeName="GlobalGlycerin"
    >
      {/* Use 'items-center' to align items vertically and 'justify-center' for horizontal alignment */}
      <div className="flex flex-col items-center justify-center w-full p-4">
        <div className="w-full max-w-md">
          {" "}
          {/* Adjust width as necessary */}
          <div className="mb-4">
            <h3 className="text-gray-800">Current Glycerin Unit:</h3>
            <h3 className="text-gray-800">{glycerinData || "N/A"}</h3>
          </div>
          <div className="mb-4">
            <h3 className="text-gray-800">New Glycerin Unit:</h3>
            <input
            onChange={(e) => setNewGlycerin(parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-black"
              type="number"
              placeholder="Enter new glycerin unit"
            />
          </div>
          <button
          onClick={()=>updateGlycerin()}
            className="w-full h-10 text-white font-bold py-2 px-4 rounded"
            style={{ backgroundColor: "orange", border: "none" }} // Remember to define your 'updateGlycerin' function logic
          >
            Update Glycerin Unit
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
