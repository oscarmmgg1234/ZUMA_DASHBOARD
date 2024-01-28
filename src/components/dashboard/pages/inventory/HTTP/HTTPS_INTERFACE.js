import {
  Get_Products,
  getProductAnalytics,
  getShipmentByDate,
  getProductsInventory,
  getActivationByDate,
  getReductionbyDate,
  manageProducts,
  updateStock
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
  getActivationByDate = async (args) => {
    return await getActivationByDate(args);
  }
  getReductionbyDate = async (args) => {
    return await getReductionbyDate(args);
  }
  manageProducts = async (action, data) => {
    return await manageProducts(action, data);
  } 
  updateStock = async (data, option) => {
    return await updateStock(data, option);
  }

}
