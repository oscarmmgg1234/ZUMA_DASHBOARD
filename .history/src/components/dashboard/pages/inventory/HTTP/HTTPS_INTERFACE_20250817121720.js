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
  getProductTypes,
  commitChanges,
  fetchRegistry,
  runtimeTest,
  addProductProcess,
  getPastYearShipments,
  deleteProduct,
  getGlobalMetrics,
  getScannerData,
  addScanner,
  deleteScanner,
  getProductHistory,
  getEmployeeData,
  getProductByID,
  getVirtualStockPools,
  createVirtualPools,
  virtualPoolProductAdd,
  virtualPoolProductRemove,
  apiCreateVirtualPool,
  apiRemoveVirtualPool,
  apiUpdateVirtualLinkedProducts,
  apiUpdateVirtualPoolName,
  apiUpdateVirtualStock,
  tokenPreCheck
} from "./HTTPS";

export default class http_handler {
  _token
  api_createVirtualPool = async (args) => {
    return await apiCreateVirtualPool(args);
  };
  api_removeVirtualPool = async (args) => {
    return await apiRemoveVirtualPool(args);
  };
  api_updateVirtualLinkedProducts = async (args) => {
    return await apiUpdateVirtualLinkedProducts(args);
  };
  api_updateVirtualPoolName = async (args) => {
    return await apiUpdateVirtualPoolName(args);
  };
  api_updateVirtualStock = async (args) => {
    return await apiUpdateVirtualStock(args);
  };
  getVirtualStockPools = async (args) => {
    return await getVirtualStockPools(args);
  };
  createVirtualPools = async (args) => {
    return await createVirtualPools(args);
  };
  virtualPoolProductAdd = async (args) => {
    return await virtualPoolProductAdd(args);
  };
  virtualPoolProductRemove = async (args) => {
    return await virtualPoolProductRemove(args);
  };
  getProductByID = async (args) => {
    return await getProductByID(args);
  };
  getEmployeeData = async () => {
    return await getEmployeeData();
  };
  getProductHistory = async (productID, range) => {
    return await getProductHistory(productID, range);
  };
  addScanner = async (data) => {
    return await addScanner(data);
  };
  deleteScanner = async (hardwareID) => {
    return await deleteScanner(hardwareID);
  };
  getScannerData = async () => {
    return await getScannerData();
  };
  getGlobalMetrics = async () => {
    return await getGlobalMetrics();
  };
  deleteProduct = async (data) => {
    return await deleteProduct(data);
  };
  getPastYearShipments = async () => {
    return await getPastYearShipments();
  };
  addProductProcess = async (data) => {
    return await addProductProcess(data);
  };
  runtimeTest = async (data) => {
    return await runtimeTest(data);
  };
  fetchRegistry = async () => {
    return await fetchRegistry();
  };
  commitChanges = async (data) => {
    return await commitChanges(data);
  };
  getProductTypes = async () => {
    return await getProductTypes();
  };
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
