import {
  Get_Products,
  getProductAnalytics,
  getShipmentByDate,
  getProductsInventory,
  getActivationByDate,
  getReductionbyDate,
  manageProducts,
  updateStock,
  getCompanies,
  updateTracking,
  deleteCompany,
  addCompany,
  getGlobalGlycerin,
  setGlycerinGlobal,
} from "./HTTPS";

export default class http_handler {
  setGlobalGlycerin = async (data) => {
    await setGlycerinGlobal(data);
  };
  getGlobalGlycerin = async () => {
    return await getGlobalGlycerin();
  };
  addCompany = async (data) => {
    await addCompany(data);
  };
  deleteCompany = async (data) => {
    await deleteCompany(data);
  };

  updateTracking = async (data) => {
    updateTracking(data);
  };
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
  };
  getReductionbyDate = async (args) => {
    return await getReductionbyDate(args);
  };
  manageProducts = async (action, data) => {
    return await manageProducts(action, data);
  };
  updateStock = async (data, option) => {
    return await updateStock(data, option);
  };
  getPartnerCompanies = async () => {
    return await getCompanies();
  };
}
