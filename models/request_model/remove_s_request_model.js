class remove_request_model {
  date = null;
  e_id = null;
  revert = false;
  constructor(args) {
    this.date = args[0] ? args[0] : null;
    this.e_id = args[1] ? args[1] : null;
    this.revert = args[2] ? args[2] : false;
  }
  validate() {
    const start_date = new Date(this.date);
    if (
      this.date == null ||
      this.e_id == null ||
      this.date == "" ||
      this.e_id == "" ||
      isNaN(start_date)
    ) {
      return false;
    }
    return true;
  }
}
const RemoveRequestModel = (args) => {
  return new remove_request_model([args.date, args.e_id, args.revert]);
};

exports.RemoveRequestModel = RemoveRequestModel;
