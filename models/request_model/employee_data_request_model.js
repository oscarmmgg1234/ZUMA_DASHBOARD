class employee_request_model {
    e_id = null;
    range_start = null;
    range_end = null;  
    constructor(args){
        range_start = args[0]? args[2] : null;
        range_end = args[1]? args[2] : null;
        e_id = args[2]? args[2] : null;
    }
    validate(){
        if(this.range_start == "" || this.range_end == "" || this.e_id == "" 
        || this.range_start == null || this.range_end == null || this.e_id == null){
            return false;
        }
        return true;
    }
}

const employeeRequestModel = (args) => {
    return new employee_request_model([args.range_start, args.range_end, args.e_id]);
}

exports.employeeRequestModel = employeeRequestModel;