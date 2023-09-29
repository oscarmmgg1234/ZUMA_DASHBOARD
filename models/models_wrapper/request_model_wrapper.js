const {pdfRequestModel} = require("../request_model/pdf_request_model");
const {employeeRequestModel} = require('../request_model/employee_data_request_model');
const {employeeShiftStartRequestModel} = require('../request_model/employee_shift_start_request_model')
const {PreviewRequestModel} = require('../request_model/preview_request_model')
const {RemoveRequestModel} = require('../request_model/remove_s_request_model')
const {assignRequestModel} = require('../request_model/assign_request_model')
const {assignEditRequestModel} = require('../request_model/assign_edit_request_model')
const {PreviewEditAssignmentRequestModel} = require('../request_model/preview_edit_assign_model')

const pdf_request_model = (args, callback) => {
    return callback(pdfRequestModel(args));
}

const employee_data_request_model = (args) => {
    return employeeRequestModel(args);
}

const employee_shift_start_request_model = (args) => {
    return employeeShiftStartRequestModel(args);
}

const preview_shift = (args) => {
    return PreviewRequestModel(args);
}

const remove_shift = (args) => {
    return RemoveRequestModel(args);
}

const add_assignment = (args) => {
    return assignRequestModel(args);
}

const assign_edit = (args) => {
    return assignEditRequestModel(args);
}

const preview_edit_assign = (args) => {
    return PreviewEditAssignmentRequestModel(args);
}




exports.pdfRequestModel_Wrapper = pdf_request_model;
exports.employeeRequestModel_Wrapper = employee_data_request_model;
exports.employeeShiftStartRequestModel_Wrapper = employee_shift_start_request_model;
exports.previewShift_Wrapper = preview_shift;
exports.removeShift_Wrapper = remove_shift;
exports.addAssignment_Wrapper = add_assignment;
exports.editAssignment_Wrapper = assign_edit;
exports.previewEditAssignment_wrapper = preview_edit_assign;