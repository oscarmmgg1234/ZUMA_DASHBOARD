const base_url = "http://localhost:3001";
// http://192.168.1.176:3002



export const reverTransaction = async (data) => {
  const 
}

export const updateTypeInfo = async (data) => {
  const res = await fetch(`${base_url}/updateTypeInfo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const manageTypes = async (data) => {
  const res = await fetch(`${base_url}/manageTypes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateProductType = async (data) => {
  const res = await fetch(`${base_url}/updateProductType`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const getTypesWithProducts = async () => {
  const res = await fetch(`${base_url}/getTypesWithProducts`, {
    method: "GET",
  });
  return await res.json();
};

// --- COMPANY HELPERS ---
export const updateCompanyInfo = async (data) => {
  const res = await fetch(`${base_url}/updateCompanyInfo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const manageCompanies = async (data) => {
  const res = await fetch(`${base_url}/manageCompanies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateProductCompany = async (data) => {
  const res = await fetch(`${base_url}/updateProductCompany`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const getCompaniesWithProducts = async () => {
  const res = await fetch(`${base_url}/getCompaniesWithProducts`, {
    method: "GET",
  });
  return await res.json();
};

export const tokenPreCheck = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/tokenPreCheck`, options);
  return await response.json();
};

export const apiRemoveVirtualPool = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/apiRemoveVirtualPool`, options);
  return await response.json();
};
export const apiCreateVirtualPool = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(
    `${base_url}/apiCreateVirtualStockPool`,
    options
  );
  return await response.json();
};

export const apiUpdateVirtualLinkedProducts = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/apiUpdateVirtualPoolRefs`, options);
  return await response.json();
};

export const apiUpdateVirtualStock = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/apiUpdateVirtualStock`, options);
  return await response.json();
};
export const apiUpdateVirtualPoolName = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/apiUpdateVirtualPoolName`, options);
  return await response.json();
};
export const getVirtualStockPools = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getVirtualStockPools`, options);
  return await response.json();
};
export const createVirtualPools = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/createVirtualPool`, options);
  return await response.json();
};
export const virtualPoolProductAdd = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/virtualStockProductAdd`, options);
  return await response.json();
};
export const virtualPoolProductRemove = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(
    `${base_url}/virtualStockProductRemove`,
    options
  );
  return await response.json();
};
export const getProductByID = async (id) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id }),
  };
  const response = await fetch(`${base_url}/getProductByID`, options);
  return await response.json();
};

export const getEmployeeData = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/get_employee_info`, options);
  return await response.json();
};

export const getProductHistory = async (productID, dateRange) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dateRange: dateRange, productID: productID }),
  };
  const response = await fetch(`${base_url}/getProductHistory`, options);
  return await response.json();
};

export const deleteScanner = async (id) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/deleteHarware/${id}`, options);
  return await response.json();
};

export const addScanner = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/addHardware`, options);
  return await response.json();
};

export const getScannerData = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getScannerData`, options);
  return await response.json();
};
export const getGlobalMetrics = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(
    `http://192.168.1.248:3004/metrics/global`,
    options
  );
  return await response.json();
};

export const deleteProduct = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/delProduct`, options);
  return await response.json();
};
export const getPastYearShipments = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getPastYearShipments`, options);
  return await response.json();
};

export const addProductProcess = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/addProdProcess`, options);
  return await response.json();
};

export const runtimeTest = async (data) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${base_url}/runtimeTest`, options);
  return await response.text();
};

export const fetchRegistry = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getFuncRegistry`, options);
  return await response.json();
};
export const commitChanges = async (data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/commitChanges`, options);
  return await response.json();
};

export const getProductTypes = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getProductTypes`, options);
  return await response.json();
};

export const setGlycerinGlobal = async (data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(`${base_url}/setGlycerinGlobal`, options);
};

export const getGlobalGlycerin = async () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getGlycerinGlobal`, options);
  return await response.json();
};

export const addCompany = async (data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(`${base_url}/addCompany`, options);
};

export const deleteCompany = async (data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(`${base_url}/deleteCompany`, options);
};

export const updateTracking = async (data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(`${base_url}/trackProduct`, options);
};

export const getCompanies = async () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${base_url}/getPartnerCompanies`, options);
  return await response.json();
};

export const updateStock = async (data, option) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = option
    ? await fetch(`${base_url}/modify_stored_stock`, options)
    : await fetch(`${base_url}/modify_active_stock`, options);
  return await response.json();
};

export const manageProducts = async (action, data) => {
  const options = {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response =
    action == "add"
      ? await fetch(`${base_url}/addProduct`, options)
      : await fetch(`${base_url}/deleteProduct`, options);
  return await response.json();
};

export const getProductsInventory = async () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(`${base_url}/getInventory`, options);
  return await response.json();
};

export const Get_Products = async () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(`${base_url}/get_products_dash`, options);
  return await response.json();
};

export const getProductAnalytics = async (args) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  };
  const response = await fetch(`${base_url}/get_product_analytics`, options);
  return await response.json();
};

export const getShipmentByDate = async (args) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  };
  const response = await fetch(`${base_url}/get_shipment_by_date`, options);
  return await response.json();
};

export const getActivationByDate = async (args) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  };
  const response = await fetch(`${base_url}/getActivationByDate`, options);
  return await response.json();
};

export const getReductionbyDate = async (args) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  };
  const response = await fetch(`${base_url}/getReductionByDate`, options);
  return await response.json();
};
