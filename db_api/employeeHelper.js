const { db_init } = require("./db_init");
const date = require("date-and-time");
const fs = require("fs");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const { request } = require("../models/models_interface/request_interface");
const wkhtmltopdf = require("wkhtmltopdf");
const { query } = require("express");
const {
  employee,
} = require("../workers/employee_interface/employee_interface");
const { parse } = require("path");
const req = new request();
var html = fs.readFileSync("./html_templates/time_sheet.html", "utf8");

const db = db_init();
db.connect();

const querys = {
  get_all_time_sheet:
    "SELECT EMPLOYEE_ID, COUNT(*) OVER() AS count FROM EMPLOYEE",
  get_employees: "SELECT * FROM EMPLOYEE",
  get_count_shift_entry:
    "SELECT COUNT(*) AS entryCount FROM SHIFT_LOG WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ?",
  insert_shift_employee:
    "INSERT INTO SHIFT_LOG(EMPLOYEE_ID,SHIFT_START,SHIFT_DATE) VALUES (?,?,?)",
  insert_shift_end_employee:
    "UPDATE SHIFT_LOG SET SHIFT_END = ? WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ?",
  get_specific_employee_info: "SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?",
  get_shift_log:
    "SELECT * FROM SHIFT_LOG WHERE SHIFT_DATE >= ? AND SHIFT_DATE <= ? AND EMPLOYEE_ID = ?",
  get_specific_s_log:
    "SELECT * FROM SHIFT_LOG WHERE SHIFT_DATE = ? AND EMPLOYEE_ID = ?",
  remove_shift_log:
    "UPDATE SHIFT_LOG SET VALID = 0 WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ? ",
  revert_remove_shift_log:
    "UPDATE SHIFT_LOG SET VALID = 1 WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ?",
  transform_start_shift_log:
    "UPDATE SHIFT_LOG SET SHIFT_START = ? WHERE EMPLOYEE_ID = ?",
  transform_end_shift_log:
    "UPDATE SHIFT_LOG SET SHIFT_END = ? WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ?",
  transform_start_shift_log:
    "UPDATE SHIFT_LOG SET SHIFT_START = ? WHERE EMPLOYEE_ID = ? AND SHIFT_DATE = ?",
  add_assignmnent_log:
    "INSERT INTO WORK_ASSIGNMENT(EMPLOYEE_ID, RANGET, START_ASSIGN, END_ASSIGN,ASSIGNMENT_DATE, ENTRY_ID ) VALUES (?,?,?,?,?,?)",
  transform_edit_assignment_start:
    "UPDATE WORK_ASSIGNMENT SET START_ASSIGN = ? WHERE ENTRY_ID = ?",
  transform_edit_assignment_end:
    "UPDATE WORK_ASSIGNMENT SET END_ASSIGN = ? WHERE ENTRY_ID = ?",
  preview_edit_assignment:
    "SELECT * FROM WORK_ASSIGNMENT WHERE EMPLOYEE_ID = ? AND ASSIGNMENT_DATE = ?",
  view_assignments:
    "SELECT * FROM WORK_ASSIGNMENT WHERE EMPLOYEE_ID = ? AND ASSIGNMENT_DATE >= ? AND ASSIGNMENT_DATE <= ?",
  get_e_assignments:
    "SELECT * FROM WORK_ASSIGNMENT EMPLOYEE_ID = ? AND ASSIGNMENT_DATE = ?",
};

const insertStartShiftTimeSlot = (args) => {
  //check if entry exist
  db.query(
    querys.get_count_shift_entry,
    [args[0], args[2]],
    (err, result, fields) => {
      if (err) return err;
      var data = Object.values(JSON.parse(JSON.stringify(result)));
      if (data[0].entryCount == 0) {
        db.query(querys.insert_shift_employee, args, (err, result) => {});
      }
    }
  );
};

const insertEndShiftTimeSlot = (args) => {
  db.query(
    querys.insert_shift_end_employee,
    [args[1], args[0], args[2]],
    (err, result) => {}
  );
};

const getEmployeeInfo = (args) => {
  return new Promise((resolve) => {
    db.query(
      querys.get_specific_employee_info,
      [args],
      (err, result, fields) => {
        if (err) resolve(err);
        resolve(Object.values(JSON.parse(JSON.stringify(result))));
      }
    );
  });
};

const validate = (day) => {
  var date_valid = date.compile("ddd");
  var validation = date.format(day, date_valid);
  if (validation == "Sat" || validation == "Sun") {
    return false;
  }
  return true;
};

const check_weekend_shift = (args) => {
  var valid = date.compile("hh:mm A");
  var date1 = date.format(args.date1, valid);
  var date2 = date.format(args.date2, valid);
  return date1 == date2 ? false : true;
};

const getEmployee_formatted = (args) => {
  return new Promise((resolve) => {
    var othours = 0;
    var hours = 0;
    var date1;
    var date2;
    var date3;
    var output;
    const date_pattern = date.compile("ddd,  MMM DD YYYY");
    const query_date = date.compile("YYYY-MM-DD");
    const date_pattern_shift = date.compile("hh:mm A");
    db.query(
      querys.get_shift_log,
      [
        date.format(args.range_start, query_date),
        date.format(args.range_end, query_date),
        args.e_id,
      ],
      function (err, result, fields) {
        output = Object.values(JSON.parse(JSON.stringify(result))).map(
          (val) => {
            const fullTime = 40;
            date1 = new Date(val.SHIFT_START);
            date2 = new Date(val.SHIFT_END);
            date3 = new Date(val.SHIFT_DATE);
            hours = Math.floor(date.subtract(date2, date1).toHours());
            if (hours > 40) {
              othours = hours - 40;
            }
            return {
              ...val,
              SHIFT_START:
                val.VALID == 1
                  ? validate(date1)
                    ? date.format(date1, date_pattern_shift)
                    : check_weekend_shift({ date1, date2 })
                    ? date.format(date1, date_pattern_shift)
                    : "Weekend Off"
                  : "Called Off",
              SHIFT_END:
                val.VALID == 1
                  ? validate(date2)
                    ? date.format(date2, date_pattern_shift)
                    : check_weekend_shift({ date1, date2 })
                    ? date.format(date2, date_pattern_shift)
                    : "Weekend Off"
                  : "Called Off",
              SHIFT_HOURS:
                val.VALID == 1
                  ? hours > 40
                    ? fullTime.toFixed(2)
                    : hours.toFixed(2)
                  : parseFloat("0.00").toFixed(2),
              SHIFT_OTHOURS:
                val.VALID == 1
                  ? othours.toFixed(2)
                  : parseFloat("0.00").toFixed(2),
              SHIFT_DATE: date.format(date3, date_pattern),
            };
          }
        );
        resolve(output);
      }
    );
  });
};

const GeneratePDF = async (args) => {
  return new Promise(async (Resolve) => {
    var data = await getEmployee_formatted(args);
    var employee_data = await getEmployeeInfo(args.e_id);
    var Days = 0;
    var TotalHours = 0;
    var TotalOTHours = 0;
    data.forEach((val) => {
      TotalHours += parseFloat(val.SHIFT_HOURS);
      TotalOTHours += parseFloat(val.SHIFT_OTHOURS);
      if (val.VALID == 1 && parseFloat(val.SHIFT_HOURS) > 0) {
        Days = Days + 1;
      }
    });
    const pattern = date.compile("MMM DD YYYY");

    employee_data[0].SHIFT_START = date.format(args.range_start, pattern);
    employee_data[0].SHIFT_END = date.format(args.range_end, pattern);
    employee_data[0].SHIFT_HOURS = TotalHours;
    employee_data[0].SHIFT_OTHOURS = TotalOTHours;
    employee_data[0].NAME = employee_data[0].NAME.toUpperCase();
    employee_data[0].SHIFT_DAYS = Days;

    var templateSRC = Handlebars.compile(html);
    const input_data = { employeeData: data, employee: employee_data[0] };
    const output_html = templateSRC(input_data);

    let buffers = [];
    wkhtmltopdf(
      output_html,
      {
        pageSize: "letter",
        orientation: "portrait",
        marginTop: "5mm",
        marginRight: "5mm",
        marginBottom: "5mm",
        marginLeft: "5mm",
      },
      (err, stream) => {
        if (err) console.log(err);
        stream.on("data", (data) => {
          buffers.push(data);
        });
        stream.on("end", () => {
          let blob = new Blob(buffers, { type: "application/pdf" });
          Resolve(blob.arrayBuffer());
        });
      }
    );
  });
};

const generate_time_sheet = async (args) => {
  const pdfBlob = await GeneratePDF(args);
  return Buffer.from(await pdfBlob);
};

const generate_all_time_sheets = async (args) => {
  const files = [];
  const employeeIds = await new Promise((resolve) => {
    db.query(querys.get_all_time_sheet, (err, result) => {
      if (err) throw err;
      const ids = result.map((row) => row.EMPLOYEE_ID);
      resolve(ids);
    });
  });

  for (const employeeId of employeeIds) {
    var newArgs = null;
    req.pdf_r_model(
      {
        employee_id: employeeId,
        shift_start_range: args.range_start,
        shift_end_range: args.range_end,
      },
      (obj) => (newArgs = obj)
    );
    const file = await generate_time_sheet(newArgs);
    files.push(file);
  }
  const mergedFile = await merge_pdf(files);
  return mergedFile;
};

const merge_pdf = async (buffers) => {
  const mergedPdf = await PDFDocument.create();
  for (let i = 0; i < buffers.length; i++) {
    const pdf = await PDFDocument.load(buffers[i]);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedPdfBytes = await mergedPdf.save();
  return mergedPdfBytes;
};

const getEmployees = () => {
  return new Promise((resolve) => {
    db.query(querys.get_employees, (err, result) => {
      resolve(Object.values(JSON.parse(JSON.stringify(result))));
    });
  });
};

const previewTransformEndShift = (args) => {
  return new Promise((resolve) => {
    const date_entry_pattern = date.compile("YYYY-MM-DD");
    const output_entry_pattern = date.compile("YYYY-MM-DD HH:mm");

    const tempstart = new Date(args.date);
    const start = date.addDays(tempstart, -2);
    const range_start = date.addDays(start, 2);
    const range_end = start;

    db.query(
      querys.get_shift_log,
      [
        date.format(range_end, date_entry_pattern),
        date.format(range_start, date_entry_pattern),
        args.e_id,
      ],
      (err, result) => {
        const data = Object.values(JSON.parse(JSON.stringify(result)));
        const newStart = date.addDays(start, 2);
        const date_res = data.map((dateObj) => {
          if (
            date
              .format(new Date(dateObj.SHIFT_DATE), date_entry_pattern)
              .toString() ==
            date.format(newStart, date_entry_pattern).toString()
          ) {
            const newDate = date.addHours(
              new Date(dateObj.SHIFT_END),
              args.hours
            );
            const inpt = date.format(newDate, output_entry_pattern);
            return {
              SHIFT_END: dateObj.VALID == 1 ? inpt : "Called Off",
              SHIFT_CHANGE: true,
            };
          } else {
            return {
              SHIFT_END:
                dateObj.VALID == 1
                  ? date.format(
                      new Date(dateObj.SHIFT_END),
                      output_entry_pattern
                    )
                  : "Called Off",
              SHIFT_CHANGE: false,
            };
          }
        });
        resolve(date_res);
      }
    );
  });
};

// previewTransformEndShift({date: "2023-05-08", e_id: "00001", hours: -3})

const previewTransformStartShift = (args) => {
  return new Promise((resolve) => {
    const date_entry_pattern = date.compile("YYYY-MM-DD");
    const output_entry_pattern = date.compile("YYYY-MM-DD HH:mm");

    const tempstart = new Date(args.date);
    const start = date.addDays(tempstart, -2);
    const range_start = date.addDays(start, 2);
    const range_end = start;

    db.query(
      querys.get_shift_log,
      [
        date.format(range_end, date_entry_pattern),
        date.format(range_start, date_entry_pattern),
        args.e_id,
      ],
      (err, result) => {
        const data = Object.values(JSON.parse(JSON.stringify(result)));
        const newStart = date.addDays(start, 2);
        const date_res = data.map((dateObj) => {
          if (
            date
              .format(new Date(dateObj.SHIFT_DATE), date_entry_pattern)
              .toString() ==
            date.format(newStart, date_entry_pattern).toString()
          ) {
            const newDate = date.addHours(
              new Date(dateObj.SHIFT_START),
              args.hours
            );
            const inpt = date.format(newDate, output_entry_pattern);
            return {
              SHIFT_CHANGE: true,
              SHIFT_START: dateObj.VALID == 1 ? inpt : "Called Off",
            };
          } else {
            return {
              SHIFT_START:
                dateObj.VALID == 1
                  ? date.format(
                      new Date(dateObj.SHIFT_START),
                      output_entry_pattern
                    )
                  : "Called Off",
              SHIFT_CHANGE: false,
            };
          }
        });
        resolve(date_res);
      }
    );
  });
};

const previewRemoveShift = (args) => {
  return new Promise((resolve) => {
    const date_entry_pattern = date.compile("YYYY-MM-DD");
    const output_entry_pattern = date.compile("YYYY-MM-DD HH:mm");

    const tempstart = new Date(args.date);
    const start = date.addDays(tempstart, -2);
    const range_start = date.addDays(start, 2);
    const range_end = start;

    db.query(
      querys.get_shift_log,
      [
        date.format(range_end, date_entry_pattern),
        date.format(range_start, date_entry_pattern),
        args.e_id,
      ],
      (err, result) => {
        const data = Object.values(JSON.parse(JSON.stringify(result)));
        const newStart = date.addDays(start, 2);
        const date_res = data.map((dateObj) => {
          if (
            date
              .format(new Date(dateObj.SHIFT_DATE), date_entry_pattern)
              .toString() ==
            date.format(newStart, date_entry_pattern).toString()
          ) {
            return {
              SHIFT_CHANGE: true,

              SHIFT_DATE:
                dateObj.VALID == 1
                  ? date.format(
                      new Date(dateObj.SHIFT_DATE),
                      date_entry_pattern
                    )
                  : "Called Off",
            };
          } else {
            return {
              SHIFT_CHANGE: false,
              SHIFT_DATE:
                dateObj.VALID == 1
                  ? date.format(
                      new Date(dateObj.SHIFT_DATE),
                      date_entry_pattern
                    )
                  : "Called Off",
            };
          }
        });
        resolve(date_res);
      }
    );
  });
};

const transformEndShift = (args) => {
  //add a remove rever function that will
  const date_pattern = date.compile("YYYY-MM-DD");
  const start_date = new Date(args.date);
  //const entry_date = date.addDays(start_date, -1);

  db.query(
    querys.get_specific_s_log,
    [date.format(start_date, date_pattern), args.e_id],
    (err, result) => {
      const data = Object.values(JSON.parse(JSON.stringify(result)));
      if ((data[0].VALID = 1)) {
        if (data.length == 0) {
        } else {
          const shift_date = new Date(data[0].SHIFT_END);
          const upated_date = date.addHours(shift_date, args.hours);
          db.query(
            querys.transform_end_shift_log,
            [upated_date, args.e_id, date.format(start_date, date_pattern)],
            (err, result) => {}
          );
        }
      }
    }
  );
};

const transformStartShift = (args) => {
  const date_pattern = date.compile("YYYY-MM-DD");
  const start_date = new Date(args.date);
  //const entry_date = date.addDays(start_date, -1);

  db.query(
    querys.get_specific_s_log,
    [date.format(start_date, date_pattern), args.e_id],
    (err, result) => {
      const data = Object.values(JSON.parse(JSON.stringify(result)));
      if ((data[0].VALID = 1)) {
        if (data.length == 0) {
        } else {
          const shift_date = new Date(data[0].SHIFT_START);
          const upated_date = date.addHours(shift_date, args.hours);
          db.query(
            querys.transform_start_shift_log,
            [upated_date, args.e_id, date.format(start_date, date_pattern)],
            (err, result) => {}
          );
        }
      }
    }
  );
};

const removeShift = (args) => {
  const date_pattern = date.compile("YYYY-MM-DD");
  // const newDate = date.addDays(new Date(args.date), -1);
  if (args.revert == false) {
    db.query(querys.remove_shift_log, [
      args.e_id,
      date.format(new Date(args.date), date_pattern),
    ]);
  } else {
    db.query(querys.revert_remove_shift_log, [
      args.e_id,
      date.format(new Date(args.date), date_pattern),
    ]);
  }
};

// 3-4 weeks ~~~
// PHASE ONE OF SYSTEM DONEE!!!
//overall work
/*


-finish assignments current effort 
- work on security of app meaning implement rate-limiters and helmet middleware either on servers or AWS 
- use lets encrypt to set up safe ssl connections all throughout app
- set api key for server security -> use a proxy server for token serve
- implement errors and handlers --> wrong password and email lead to error --> define nextauth callbacks 
- increacse db size
- look into host providers for dns resolution
- inventory -> work with shopify dev api -> create 
- create analytics server for dashoard
- create alerts system
- major dashboard ui improvements -> improve web app responsiveness -> profile app for optimizations

*/
//flow of feature + plus work
// add assignments
// - set up mysql triggers for uuid and range update
// - set up adding preview in front end

//preview assignment edit
// use uuid to change range end/start
// set up funtionality to preview entry or entries and select one and fetch with that uuid with the given parameters

//view assignment list
// display assignments easy part hehe

// date = null;
// e_id = null;
// range_start = null;
// range_end = null;
//add assignments for employees
const addAssignment = (args) => {
  const date_pattern = date.compile("YYYY-MM-DD");
  const start = new Date(args.date);
  db.query(querys.add_assignmnent_log, [
    args.e_id,
    0,
    args.range_start,
    args.range_end,
    date.format(start, date_pattern),
    "23234",
  ]);
};

// addAssignment({e_id: "00001", range_start: 300, range_end: 420, date: "2023-05-07"});

const editAssignment = (args) => {
  if (args.ShiftRange == "start") {
    db.query(querys.transform_edit_assignment_start, [
      args.assingmentRangeOption,
      args.entryId,
    ]);
  } else {
    db.query(querys.transform_edit_assignment_end, [
      args.assingmentRangeOption,
      args.entryId,
    ]);
    //example args {entryId, assignmentRangeOption, shiftRange}
  }
};

// editAssignment({ShiftRange: "end", assingmentRangeOption: 2000, entryId: '1617cb0a-ed07-11ed-88b0-0ef979731541'});

const previewEditAssignment = (args) => {
  return new Promise((Resolve) => {
    //example args {e_id, date, assignmentRangeOption, shiftRange} => return all assignment entries corrolated to that eid and date
    const date_pattern = date.compile("YYYY-MM-DD");
    const start = new Date(args.date);

    db.query(
      querys.preview_edit_assignment,
      [args.e_id, date.format(start, date_pattern)],
      (err, result) => {
        const data = Object.values(JSON.parse(JSON.stringify(result)));
        const output = data.map((obj, index) => {
          return {
            ENTRY_ID: obj.ENTRY_ID,
            RANGE: obj.RANGE,
            START_ASSIGN:
              args.assignmentRangeOption == "start"
                ? args.shiftRange
                : obj.START_ASSIGN,
            END_ASSIGN:
              args.assignmentRangeOption == "start"
                ? obj.END_ASSIGN
                : args.shiftRange,
            RANGE: parseInt(obj.END_ASSIGN) - parseInt(obj.START_ASSIGN),
            ENTRY_DATE: date.format(start, date_pattern),
          };
        });

        Resolve(output);
      }
    );
  });
};
// const a = previewEditAssignment({e_id: "00001", date: "2023-05-05T05:05:00", assignmentRangeOption: "start", shiftRange: 300})
// [
//   {
//     ENTRY_ID: '1617cb0a-ed07-11ed-88b0-0ef979731541',
//     RANGE: 1000,
//     START_ASSIGN: 300,
//     END_ASSIGN: 2000,
//     ENTRY_DATE: '2023-05-05'
//   },
//   {
//     ENTRY_ID: '5372da52-ed08-11ed-88b0-0ef979731541',
//     RANGE: 120,
//     START_ASSIGN: 300,
//     END_ASSIGN: 420,
//     ENTRY_DATE: '2023-05-05'
//   }
// ]

const viewAssigments = (args) => {
  //example args {e_id, range_start, range_end} ==> return all assignments within range
  return new Promise((Resolve) => {
    const date_compile = date.compile("YYYY-MM-DD");
    const range_start = date.addDays(new Date(args.range_start), -1);
    const range_end = date.addDays(new Date(args.range_end), -1);
    db.query(
      querys.view_assignments,
      [
        args.e_id,
        date.format(range_start, date_compile),
        date.format(range_end, date_compile),
      ],
      (err, result) => {
        const data = Object.values(JSON.parse(JSON.stringify(result)));
        Resolve(data);
      }
    );
  });
};

const viewAssignmentRange = (args) => {};

const removeAssignment = (args) => {
  //example args {e_id, date}
};

const previewRemoveAssignment = (args) => {
  //example args {e_id, date}
};

exports.GeneratePDF = GeneratePDF;
exports.getEmployeeInfo = getEmployeeInfo;
exports.insertStartShiftTime = insertStartShiftTimeSlot;
exports.insertEndShiftTime = insertEndShiftTimeSlot;
exports.getZumaEmployees = getEmployees;
exports.getJsonEmployeeData = getEmployee_formatted;
exports.GeneratePDF_ALL = generate_all_time_sheets;
exports.PreviewEndTransformation = previewTransformEndShift;
exports.PreviewStartTransformation = previewTransformStartShift;
exports.transformStartShift = transformStartShift;
exports.transformEndShift = transformEndShift;
exports.removeShift = removeShift;
exports.PreviewRemoveShift = previewRemoveShift;
exports.addAssignment = addAssignment;
exports.previewEditAssignment = previewEditAssignment;
exports.editAssignment = editAssignment;
