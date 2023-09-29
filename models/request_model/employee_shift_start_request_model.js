class employee_shift_start_request_model {
    shift_start = null;
    shift_date = null;
    e_id = null;
    constructor(args){
        shift_start = args[0]? args[0] : null;
        shift_date = args[1]? args[1] : null;
        e_id = args[2]? args[2] : null;
    }
    validate(){
        if(shift_start == null || this.shift_date == null || e_id == null || this.range_start == "" || this.range_end == "" || this.e_id == "" ){
            return false;
        }
        return true;
    }
}

const employeeShiftStartRequestModel = (args) => {
    return new employee_shift_start_request_model([args.shift_start, args.shift_date, args.e_id]);
}

exports.employeeShiftStartRequestModel = employeeShiftStartRequestModel;