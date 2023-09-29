// // const date = require('date-and-time');

// // const validate = (validate, day) => {
// //     var validation = date.format(day, validate)
// //     if(validation == 'Sat' || validation == 'Sun'){
// //         return false;
// //     }
// //     return true;
// // }

// // const populate_db = (args) => {

// //   const query = 'INSERT INTO SHIFT_LOG(EMPLOYEE_ID,SHIFT_START,SHIFT_END,SHIFT_DATE) VALUES (?,?,?,?)'
// //   const date_pattern = date.compile('YYYY-MM-DD');
// //   const validate = date.compile('ddd')
// //   const entry_pattern = date.compile('h:m A')
// //   var date_entry = new Date(args.range_start); //object that we traverse

// //   var shift_start = new Date("2023-03-93T08:00:00"); //template for entry all we need is time
// //   var shift_end = new Date("2023-03-93T15:00:00");

// //   var shift_start_entry = new Date(args.range_start); //used to find range
// //   var shift_end_entry = new Date(args.range_end);

// //   var days_sub = date.subtract(shift_end_entry,shift_start_entry).toDays(); //days

// //   for(var d = 0;d < days_sub;d++ ){
// //     if(validate(validate, date_entry)){
// //         db.query(query, [args.e_id, date.format(shift_start, entry_pattern), date.format(shift_end, entry_pattern),date.format(date_entry, date_pattern)], (err,result)=>{})
// //     } //a week day
// //     date_entry = date.addDays(date_entry, 1)
// //   }
// //   }
// //   populate_db();
// const getEmployeeInfo = (args) => {
//     return new Promise((resolve)=>{
//       db.query(querys.get_specific_employee_info, [args], (err,result,fields)=>{
//         if(err) resolve(err)
//         resolve(Object.values(JSON.parse(JSON.stringify(result))))
//       })
//     })
//   }

//   const getEmployee_formatted = (args) => {
//     return new Promise((resolve)=>{
//       var othours = 0;
//       var hours = 0;
//       var date1;
//       var date2;
//       var date3;
//       var output;
//       const date_pattern = date.compile('MMM DD YYYY');
//       const date_pattern_shift = date.compile('hh:mm A');
//       db.query(querys.get_shift_log,args.map(),function (err, result, fields) {

//           output = Object.values(JSON.parse(JSON.stringify(result))).map((val,index)=>{
//           const fullTime = 40;
//           date1 = new Date(val.SHIFT_START)
//           date2 = new Date(val.SHIFT_END)
//           date3 = new Date(val.SHIFT_DATE);
//           hours =  Math.floor(date.subtract(date2,date1).toHours());
//           if(hours > 40){
//             othours = hours - 40;
//           }
//           return {...val,SHIFT_START: date.format(date1,date_pattern_shift), SHIFT_END: date.format(date2,date_pattern_shift),SHIFT_HOURS: hours > 40 ? fullTime.toFixed(2) : hours.toFixed(2),
//           SHIFT_OTHOURS: othours.toFixed(2),SHIFT_DATE: date.format(date3, date_pattern)}
//         })
//         resolve(output)
//       });
//     })
//   }

// const validate = (validate, day) => {
//     var validation = date.format(day, validate)
//     if(validation == 'Sat' || validation == 'Sun'){
//         return false;
//     }
//     return true;
//   }

//           const populate_db = async (args) => {

//           //first chek if there is any entries

//           const check_query = 'SELECT COUNT(*) as entryCount FROM SHIFT_LOG WHERE EMPLOYEE_ID = ? AND SHIFT_DATE >= ? AND SHIFT_DATE <= ?'

//           db.query(check_query, [args.e_id, args.range_start, args.range_end], (err, result)=>{
//             var res = Object.values(JSON.parse(JSON.stringify(result)))

//           if(res[0].entryCount == 0){
//             const query = 'INSERT INTO SHIFT_LOG(EMPLOYEE_ID,SHIFT_START,SHIFT_END,SHIFT_DATE) VALUES (?,?,?,?)'
//           const date_pattern = date.compile('YYYY-MM-DD');
//           const validate_day = date.compile('ddd')
//           var date_entry = new Date(args.range_start); //object that we traverse

//           var shift_start = new Date(args.range_start); //template for entry all we need is time

//           const transform_start = new Date(date.format(shift_start,date_pattern)+ 'T08:00:00');

//           var formatted_start = transform_start;
//           var formatted_end = date.addHours(formatted_start,7);

//           var shift_start_entry = new Date(args.range_start); //used to find range
//           var shift_end_entry = new Date(args.range_end);

//           var days_sub = Math.floor(date.subtract(shift_end_entry,shift_start_entry).toDays()) + 2; //days

//           for(var d = 0;d < days_sub;d++ ){
//             if(validate(validate_day, date_entry)){
//                 db.query(query, [args.e_id, formatted_start, formatted_end,date.format(date_entry, date_pattern)], (err,result)=>{})
//             } //a week day
//             date_entry = date.addDays(date_entry, 1)
//             formatted_start = date.addDays(formatted_start, 1);
//             formatted_end = date.addDays(formatted_end, 1);
//           }
//           }

//           })

//           }

//           populate_db({e_id: "230114", range_start: "2023-05-01", range_end: "2024-05-31"})

// const check_weekend = (day) => {
//   const day_trans = date.compile("ddd");
//   const dateInQues = date.format(day, day_trans);
//   if (dateInQues == "Sat" || dateInQues == "Sun") {
//     return false;
//   }
//   return true;
// };

// const populate_db = async (args) => {
//   //first chek if there is any entries

//   const check_query =
//     "SELECT COUNT(*) as entryCount FROM SHIFT_LOG WHERE EMPLOYEE_ID = ? AND SHIFT_DATE >= ? AND SHIFT_DATE <= ?";

//   db.query(
//     check_query,
//     [args.e_id, args.range_start, args.range_end],
//     (err, result) => {
//       var res = Object.values(JSON.parse(JSON.stringify(result)));

//       if (res[0].entryCount == 0) {
//         const query =
//           "INSERT INTO SHIFT_LOG(EMPLOYEE_ID,SHIFT_START,SHIFT_END,SHIFT_DATE) VALUES (?,?,?,?)";
//         const date_pattern = date.compile("YYYY-MM-DD");
//         const validate_day = date.compile("ddd");
//         var date_entry = new Date(args.range_start); //object that we traverse

//         var shift_start = new Date(args.range_start); //template for entry all we need is time

//         const transform_start = new Date(
//           date.format(shift_start, date_pattern) + "T08:00:00"
//         );

//         var formatted_start = transform_start;
//         var formatted_end = date.addHours(formatted_start, 7);

//         var shift_start_entry = new Date(args.range_start); //used to find range
//         var shift_end_entry = new Date(args.range_end);

//         var days_sub =
//           Math.floor(
//             date.subtract(shift_end_entry, shift_start_entry).toDays()
//           ) + 2; //days

//         for (var d = 0; d < days_sub; d++) {
//           if (check_weekend(date_entry)) {
//             db.query(
//               query,
//               [
//                 args.e_id,
//                 formatted_start,
//                 formatted_end,
//                 date.format(date_entry, date_pattern),
//               ],
//               (err, result) => {}
//             );
//           } else {
//             db.query(
//               query,
//               [
//                 args.e_id,
//                 formatted_start,
//                 formatted_start,
//                 date.format(date_entry, date_pattern),
//               ],
//               (err, result) => {}
//             );
//           }
//           date_entry = date.addDays(date_entry, 1);
//           formatted_start = date.addDays(formatted_start, 1);
//           formatted_end = date.addDays(formatted_end, 1);
//         }
//       }
//     }
//   );
// };

// populate_db({
//   e_id: "000002",
//   range_start: "2023-05-01",
//   range_end: "2023-11-15",
// });
