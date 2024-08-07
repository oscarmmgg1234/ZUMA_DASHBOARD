import {
  getTopEmployee,
  getMetrics,
  getMetricsHistory,
  getEmployees,
} from "./HTTPS";

export default class http_handler {
  getTopEmployee = async () => {
    return await getTopEmployee();
  };
  getMetrics = async () => {
    return await getMetrics();
  };
  getMetricsHistory = async (params, options) => {
    return await getMetricsHistory(params, options);
  };
  getEmployees = async () => {
    return await getEmployees();
  };
}
