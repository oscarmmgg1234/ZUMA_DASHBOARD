import {
  Add_Assigment,
  GET_Preview,
  transform_shift,
  pdf_get,
  removeShift,
  Edit_Assignment_Get_Preview,
  previewRemoveShift,
  getEmployees,
  addEmployee,
  deleteEmployee,
  setSchedule,
} from "./HTTPS.js";

export default class http_handler {
  constructor() {}
  setSchedule = async (data) => {
    await setSchedule(data);
  };
  addEmployee = async (data) => {
    await addEmployee(data);
  };
  deleteEmployee = async (data) => {
    await deleteEmployee(data);
  };
  getEmployees = async () => {
    return await getEmployees();
  };
  add_assign = async (args) => {
    return await Add_Assigment(args);
  };
  preview_transform_shift = async (args) => {
    return await GET_Preview(args);
  };

  transform_shift = async (args) => {
    return await transform_shift(args);
  };

  pdf_get = async (args) => {
    return await pdf_get(args);
  };

  removeShift = async (args) => {
    return await removeShift(args);
  };
  edit_assign_preview = async (args) => {
    return await Edit_Assignment_Get_Preview(args);
  };
  previewRemoveShift = async (args) => {
    return await previewRemoveShift(args);
  };
}
