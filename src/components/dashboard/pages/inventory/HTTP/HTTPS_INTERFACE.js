import {
  Get_Products,
  getProductAnalytics,
  getShipmentByDate,
  getProductsInventory,
} from "./HTTPS";

export default class http_handler {
  getProducts = async () => {
    return await Get_Products();
  };
  getProductAnalytics = async (args) => {
    return await getProductAnalytics(args);
  };
  getShipmentByDate = async (args) => {
    return await getShipmentByDate(args);
  };
  getProductsInventory = async () => {
    return await getProductsInventory();
  };
}
