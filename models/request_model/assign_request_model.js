
class assign_request_model {
    date = null;
    e_id = null;
    range_start = null;
    range_end = null;
    constructor(args){
        this.date = args[0] ? args[0] : null;
        this.e_id = args[1] ? args[1] : null;
        this.range_start = args[2] ? args[2] : null;
        this.range_end = args[3] ? args[3] : null;
    }
    validate(){
        const start_date = new Date(this.date)
        if(this.date == null || this.e_id == null || this.date == "" ||  this.e_id == "" || isNaN(start_date)){
            return false;
        }
        return true;
    }
}
const assignRequestModel = (args) =>{
    return new assign_request_model([args.date, args.e_id, parseInt(args.range_start), parseInt(args.range_end)]);  
}


exports.assignRequestModel = assignRequestModel;