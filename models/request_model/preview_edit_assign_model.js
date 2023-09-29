// const a = previewEditAssignment({e_id: "00001", date: "2023-05-05T05:05:00", assignmentRangeOption: "start", shiftRange: 300})

class preview_assign_edit_request_model {
  date = null;
  assignmentRangeOption = null;
  e_id = null;
  shiftRange = null;

  constructor(args) {
    this.date = args[1] ? args[1] : null;
    this.assignmentRangeOption = args[3] ? args[3] : null;
    this.e_id = args[0] ? args[0] : null;
    this.shiftRange = args[2] ? args[2] : null;
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
const PreviewAssignEditRequestModel = (args) => {
  return new preview_assign_edit_request_model([
    args.e_id,
    args.date,
    parseInt(args.shiftRange),
    args.assignmentRangeOption,
  ]);
};

exports.previewAssignEditRequestModel = PreviewAssignEditRequestModel;
