const base_url = "http://localhost:3001";
// http://192.168.1.176:3002

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
