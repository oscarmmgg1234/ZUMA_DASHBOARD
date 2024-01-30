import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();

export default function ManageSystem(props) {
  const [action, setAction] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const reset = () => {
    setCompanyName("");
    setAddress("");
    setPhone("");
    setType("");
  };

  const init = async () => {
    const companies = await http.getPartnerCompanies();
    const formated_companies = companies.data.map((company) => {
      return { ...company, focus: false };
    });

    setCompanies(formated_companies);
    setFilteredCompanies(formated_companies);
  };

  useEffect(() => {
    if (searchQuery === "") return setFilteredCompanies(companies);
    else {
      const newData = companies.filter((item) =>
        item.NAME.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(newData);
    }
  }, [searchQuery]);
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    reset();
    init();
  }, [action]);

  const onFocusCompanies = (companies) => {
    const focusEvent = filteredCompanies.map((item) => {
      if (item.COMPANY_ID === companies.COMPANY_ID) {
        return { ...item, focus: !item.focus };
      } else {
        return { ...item, focus: false };
      }
    });
    setSelectedCompany(companies.focus ? null : companies);
    setFilteredCompanies(focusEvent);
  };

  const tableRows = filteredCompanies.map((company, index) => (
    <tr
      key={company.COMPANY_ID}
      className={`${
        company.focus
          ? "bg-orange-300"
          : index % 2 === 0
          ? "bg-gray-100"
          : "bg-white"
      }`}
      onClick={() => onFocusCompanies(company)}
    >
      <td className="px-4 py-2 border text-black">{company.NAME}</td>
      <td className="px-4 py-2 border text-black bg-rose-400">
        {company.COMPANY_ID}
      </td>
    </tr>
  ));

  const handleAddCompany = () => {
    if (!companyName) {
      alert("Please fill in all fields.");
      return; // Stop the function if any field is empty
    }
    const data = {
      name: companyName,
      address: address,
      phone: phone,
      type: type,
    };

    http.addCompany(data);
    alert("Company Added");
    setTimeout(() => {
      init();
    }, 500);
  };

  const handleDeleteCompany = () => {
    if (selectedCompany == null) {
      alert("Please select a product to delete");
      return;
    }
    const data = {
      companyId: selectedCompany.COMPANY_ID,
    };
    http.deleteCompany(data);
    alert("Product Deleted");
    setTimeout(() => {
      init();
    }, 500);
  };

  return (
    <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manage Partner Companies"}
      closeName={"system"}
    >
      <div className="h-full w-full">
        <button
          onClick={() => setAction(!action)}
          className="w-32 h-24 bg-orange-300"
        >
          <p className="text-xs">Click to toggle</p>
          <p className="font-bold">
            {action ? "Add Company" : "Delete Company"}
          </p>
        </button>

        <div className="flex flex-1 justify-center items-center">
          <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full">
            {action ? (
              <div className="flex flex-col space-y-3">
                <label className="font-semibold text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300 text-black"
                />

                <label className="font-semibold text-gray-700">
                  Company Address
                </label>
                <input
                  type="text"
                  placeholder="Company Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">
                  Company Description
                </label>
                <input
                  type="text"
                  placeholder="Company Description"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <label className="font-semibold text-gray-700">Phone</label>
                <input
                  type="text"
                  placeholder="Company Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3 rounded border border-gray-300  text-black"
                />

                <button
                  onClick={() => handleAddCompany()}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Add Product
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className="w-full mb-4 p-2 border rounded-lg text-black"
                    placeholder="Search..."
                  />
                  <table className="min-w-full border-collapse ">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="px-4 py-2 border text-black">
                          Company Name
                        </th>
                        <th className="px-4 py-2 border text-black">
                          Company ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>{tableRows}</tbody>
                  </table>
                </div>
                {selectedCompany !== null && (
                  <button
                    className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                    onClick={() => handleDeleteCompany()}
                  >
                    Delete Company
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
