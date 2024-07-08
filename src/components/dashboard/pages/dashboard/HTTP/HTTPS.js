const inv_base_url = "http://192.168.1.176:3001";
const metrics_base_url = "http://192.168.1.209:3002";

export const getTopEmployee = async () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${inv_base_url}/getTopEmployee`, options);
  return await response.json();
};

export const getMetrics = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${metrics_base_url}/metrics/all`, options);
  return await response.json();
};

export const getMetricsHistory = async (params, option) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const baseEnpoint = "/metrics";
  let accesspoint = "";
  if (option === "employee") {
    accesspoint = "/employee";
  }
  if (option === "total") {
    accesspoint = "/total";
  }
  if (option === "global") {
    accesspoint = "/global";
  }

  const response = await fetch(
    `${metrics_base_url}${baseEnpoint}${accesspoint}/${params[0]}/${params[1]}`,
    options
  );
  return await response.json();
};

export const getEmployees = async () => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`${metrics_base_url}/employees`, options);
  return await response.json();
}
