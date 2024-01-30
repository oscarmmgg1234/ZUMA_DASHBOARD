const base_url = "http://192.168.1.176:3001";
// http://192.168.1.176:3002

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
