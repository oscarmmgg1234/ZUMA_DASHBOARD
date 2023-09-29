
class preview_request_model {
    date = null;
    hours = null;
    e_id = null;
    constructor(args){
        this.date = args[0] ? args[0] : null;
        this.hours = args[1] ? args[1] : null;
        this.e_id = args[2] ? args[2] : null;
    }
    validate(){
        const start_date = new Date(this.date)
        if(this.date == null || this.e_id == null || this.date == "" ||  this.e_id == "" || isNaN(start_date) || this.hours == null ){
            return false;
        }
        return true;
    }
}
const PreviewRequestModel = (args) =>{
    return new preview_request_model([args.date, parseInt(args.hours), args.e_id]);  
}


exports.PreviewRequestModel = PreviewRequestModel;