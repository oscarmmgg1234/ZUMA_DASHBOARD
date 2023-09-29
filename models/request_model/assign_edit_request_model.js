
class assign_edit_request_model {
    entry_id = null;
    e_id = null;
    shiftRange = null;
    constructor(args){
        this.entry_id = args[0] ? args[0] : null;
        this.e_id = args[1] ? args[1] : null;
        this.shiftRange = args[2] ? args[2] : null;
    }
    validate(){
        const start_date = new Date(this.date)
        if(this.date == null || this.e_id == null || this.date == "" ||  this.e_id == "" || isNaN(start_date)){
            return false;
        }
        return true;
    }
}
const assignEditRequestModel = (args) =>{
    return new assign_edit_request_model([args.entry_id, args.e_id, parseInt(shiftRange)]);  
}


exports.assignEditRequestModel = assignEditRequestModel;