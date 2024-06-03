import React from "react";

export default function Navbar({ currentRoute, onRouteChange }) {
  return (
    <nav className="fixed top-10 left-1/2 transform -translate-x-1/2 w-11/12 bg-gray-200 p-4 rounded-3xl shadow-lg flex justify-start items-center mt-4 ">
      <button
        onClick={() => onRouteChange(0)}
        className={`px-4 py-2 rounded ${
          currentRoute === 0
            ? "bg-gray-600 text-white rounded-3xl mr-6"
            : "bg-gray-300 text-gray-400 mr-2"
        }`}
      >
        Edit Product
      </button>
      <button
        onClick={() => onRouteChange(1)}
        className={`px-4 py-2 rounded ${
          currentRoute === 1
            ? "bg-gray-600 text-white rounded-3xl mr-6"
            : "bg-gray-300 text-gray-400 mr-2"
        }`}
      >
        Create Product
      </button>
      <button
        onClick={() => onRouteChange(2)}
        className={`px-4 py-2 rounded ${
          currentRoute === 2
            ? "bg-gray-600 text-white rounded-3xl mr-6"
            : "bg-gray-300 text-gray-400 mr-2"
        }`}
      >
        Edit Product Tokens
      </button>
    </nav>
  );
}
