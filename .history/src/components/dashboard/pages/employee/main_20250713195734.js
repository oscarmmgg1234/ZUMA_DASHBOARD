import React, { useEffect, useState } from "react";
import tw from "tailwind-styled-components";
import { FaTimes, FaPrint, FaEye } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { Document, Page, pdfjs } from "react-pdf";
import "react-datepicker/dist/react-datepicker.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import http_handler from "./Fetch/HTTPS_INTERFACE.js";
import MyCalendar from "./components/scheduler.js";

const https = new http_handler();

const ModalBackground = tw.div`
  fixed
  z-50
  inset-0
  bg-gray-900
  opacity-50
`;

const ModalContainer = tw.div`
  fixed
  z-50
  top-1/2
  left-1/2
  transform
  -translate-x-1/2
  -translate-y-1/2
  w-3/4
  h-5/6
  bg-white
  rounded-md
  overflow-y-auto
`;

const ModalHeader = tw.div`
  flex
  justify-between
  items-center
  px-4
  py-2
  bg-gray-200
  border-b
  border-gray-400
`;

const ModalTitle = tw.h2`
  text-lg
  font-medium
`;

const ModalCloseButton = tw.button`
  focus:outline-none
  text-black
`;

const CardGrid = tw.div`
  grid
  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  gap-4
  px-4 py-6
`;

const Card = tw.div`
bg-gradient-to-br from-white to-gray-100
hover:to-gray-500
  shadow-md
  rounded-md
  p-4
`;

const SubComponent = tw.div`
  bg-gray-100
  rounded-md
  p-4
`;

//third party components

function Slider({ value, onChange }) {
  const handleToggle = () => {
    onChange(!value);
  };

  return (
    <div className="relative inline-block w-10 mr-2 align-middle select-none">
      <input
        type="checkbox"
        name="toggle"
        id="toggle"
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
        checked={value}
        onChange={handleToggle}
      />
      <label
        htmlFor="toggle"
        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
      ></label>
    </div>
  );
}

const AlertCard = ({ title, message }) => {
  return (
    <div className=" h-20 bg-white/60 border-4 border-gray-200/40 rounded-lg mb-1 p-1 animate-pulse">
      <h2 className="text-md font-medium mb-1">{title}</h2>
      <p className=" text-sm">{message}</p>
    </div>
  );
};

const Datepicker = ({ selected, setSelected }) => {
  const handleChange = (date) => {
    setSelected(date);
  };

  return (
    <DatePicker
      selected={selected}
      onChange={handleChange}
      className="border border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
    />
  );
};

const PdfViewer = ({ fileBlob }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [showPrint, setShowPrint] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setShowPrint(true);
    setNumPages(numPages);
  };

  const handlePrint = () => {
    const pdfUrl = URL.createObjectURL(fileBlob);
    window.open(pdfUrl);
    URL.revokeObjectURL(pdfUrl);
  };

  return (
    <div className="flex flex-col items-center mt-20 border-b-2 border-gray-400/50 py-2">
      <div className="bg-gray-200 p-4 rounded-md shadow-md my-4">
        <Document file={fileBlob} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} size={"letter"} />
        </Document>
      </div>
      <div className="flex items-center space-x-2">
        {showPrint && (
          <button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md block mx-auto my-4 mr-5 items-center justify-center flex"
          >
            <FaPrint className="mr-2" /> Print
          </button>
        )}
        <div className="text-gray-500 flex items-center">
          <button
            onClick={() => setPageNumber(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-2 py-1 rounded-md mr-2"
          >
            Prev
          </button>
          <span className="mr-2">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={() => setPageNumber(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-2 py-1 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const DropdownButton = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(props.data.data);

  // useEffect(() => {
  //   if (data) {
  //     setOptions(data);
  //   }
  // }, [data]);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    props.setData(option);
    setIsOpen(false);
  };

  return (
    <>
      {options.length > 0 && (
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
            id="options-menu"
            aria-haspopup="true"
            aria-expanded={isOpen ? "true" : "false"}
            onClick={handleButtonClick}
          >
            {props.dataValue}
            <svg
              className="-mr-1 ml-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 011.414 0l.707.707a1 1 0 010 1.414L11.414 10l2.293 2.293a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414 0L10 11.414l-2.293 2.293a1 1 0 01-1.414 0l-.707-.707a1 1 0 010-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414l.707-.707z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div
            className={`${
              isOpen ? "block" : "hidden"
            } absolute z-50 mt-1 w-full bg-white shadow-lg`}
            aria-labelledby="options-menu"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <button
                key={option}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                role="menuitem"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const Employee = () => {
  const [local_data, set_local_data] = useState({
    gen_emp_all: [],
    emp_data: [],
    emps: [],
    gen_emps: [],
    emp_option: [],
  });

  const getEmployees = async () => {
    const employees = await https.getEmployees();
    const run1 = employees.map((employee) => {
      return { name: employee.NAME, e_id: employee.EMPLOYEE_ID };
    });
    run1[run1.length] = { name: "PRINT_ALL", e_id: "PRINT_ALL" };
    const run2 = employees.map((employee) => {
      return { name: employee.NAME, e_id: employee.EMPLOYEE_ID };
    });
    const run3 = employees.map((employee) => {
      return `${employee.NAME}`;
    });
    const run4 = employees.map((employee) => {
      return `${employee.NAME}`;
    });
    run4[run4.length] = "PRINT_ALL";
    set_local_data({
      gen_emp_all: run1,
      emp_data: run2,
      emps: run3,
      gen_emps: run4,
      emp_option: ["start", "end"],
    });
  };

  useEffect(() => {
    getEmployees();
  }, []);

  // states
  const [showAddForm, setShowAddForm] = useState(false);
  const [isModalRmOpen, setIsModalRmOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalGenOpen, setIsModalGenOpen] = useState(false);
  const [manageEmployeeModal, setManageEmployeeModal] = useState(false);
  const [scheduleEmployeeModal, setScheduleEmployeeModal] = useState(false);

  //edit modal states
  const shiftDefault = ["start", "end"];
  const [shiftOption, setShiftOption] = useState("Select Shift"); //request option
  const [employee, setEmployee] = useState("Select Employee");
  const [selEmployeeData, setSelEmployeeData] = useState(""); //request option
  const [selectedDate, setSelectedDate] = useState(Date.now()); //request option
  const [hours, setHours] = useState(1); //request option
  const [previewData, setPreviewData] = useState([]); //request option
  const [status, setStatus] = useState(null); //request option

  const [scheduleEmployees, setScheduleEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  //Range remove range state
  const [rangeOption, setRangeOption] = useState(false);
  const [rangeSelectedStart, setRangeSelectedStart] = useState(Date.now());
  const [rangeSelectedEnd, setRangeSelectedEnd] = useState(Date.now());
  const [revertRange, setRevertRange] = useState(false);

  const getScheduleEmployees = async () => {
    const employees = await https.getEmployees();
    const formatted_employees = employees.map((employee) => {
      return { id: employee.EMPLOYEE_ID, name: employee.NAME };
    });
    setScheduleEmployees(formatted_employees);
    setSelectedEmployee(formatted_employees[0].name);
  };

  useEffect(() => {
    getScheduleEmployees();
  }, []);

  const [schedule, setSchedule] = useState({
    monday: { start: "", end: "" },
    tuesday: { start: "", end: "" },
    wednesday: { start: "", end: "" },
    thursday: { start: "", end: "" },
    friday: { start: "", end: "" },
    // ... initialize the rest of the days similarly
  });

  const handleScheduleChange = (day, type) => (event) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], [type]: event.target.value },
    });
  };

  const handleSubmit = () => {
    if (
      !selectedEmployee &&
      !schedule.monday.start &&
      !schedule.monday.end &&
      !schedule.tuesday.start &&
      !schedule.tuesday.end &&
      !schedule.wednesday.start &&
      !schedule.wednesday.end &&
      !schedule.thursday.start &&
      !schedule.thursday.end &&
      !schedule.friday.start &&
      !schedule.friday.end
    ) {
      alert("Please fill out all fields");
      return;
    }
    const employee = scheduleEmployees.filter((employee) => {
      return employee.name === selectedEmployee;
    })[0];
    const data = {
      employee_id: employee.id,
      schedule: {
        mon: [parseInt(schedule.monday.start), parseInt(schedule.monday.end)],
        tue: [parseInt(schedule.tuesday.start), parseInt(schedule.tuesday.end)],
        wed: [
          parseInt(schedule.wednesday.start),
          parseInt(schedule.wednesday.end),
        ],
        thu: [
          parseInt(schedule.thursday.start),
          parseInt(schedule.thursday.end),
        ],
        fri: [parseInt(schedule.friday.start), parseInt(schedule.friday.end)],
      },
    };
    https.setSchedule(data);
    alert("Schedule Set");
    // Here you would typically send the data to the server
  };

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  const editPreviewData = async (args) => {
    if (
      selEmployeeData != "Select Employee" &&
      selectedDate != null &&
      shiftOption != "Select Shift"
    ) {
      const data = await https.preview_transform_shift(args);
      setPreviewData(data);
    }
  };
  const submitEdit = async (args) => {
    if (
      selEmployeeData != "Select Employee" &&
      selectedDate != null &&
      shiftOption != "Select Shift"
    ) {
      const data = await https.transform_shift(args);
      setStatus(data);
    }
  };

  //remove modal states
  const [revert, setRevert] = useState(false);

  const removePreviewData = async (args) => {
    if (selEmployeeData != "Select Employee" && selectedDate != null) {
      const data = await https.previewRemoveShift(args);
      setPreviewData(data);
    }
  };
  const submitRemove = async (args) => {
    if (selEmployeeData != "Select Employee" && selectedDate != null) {
      const data = await https.removeShift(args);
      setStatus(data);
    }
  };

  //pdf modal states
  const [selectedDate1, setSelectedDate1] = useState(Date.now()); //request option
  const [selectedDate2, setSelectedDate2] = useState(Date.now()); //request option
  const [pdfBlob, setPdfBlob] = useState(null); //request option

  const [emp, setEmp] = useState("Select Employee");
  const [empData, setEmpData] = useState(""); //request option
  const gen_pdf = async (args) => {
    if (
      selectedDate1 != null &&
      selectedDate2 != null &&
      emp != "Select Employee"
    ) {
      const data = await https.pdf_get(args);
      setPdfBlob(data);
    }
  };

  useEffect(() => {
    if (emp != "Select Employee") {
      const empres = local_data.gen_emp_all.filter((val) => {
        if (emp == val.name) {
          return val;
        }
      });
      setEmpData(empres[0].e_id);
    }
  }, [emp]);

  useEffect(() => {
    if (employee != "Select Employee") {
      const emp = local_data.emp_data.filter((val) => {
        if (employee == val.name) {
          return val;
        }
      });
      setSelEmployeeData(emp[0].e_id);
    }
  }, [employee]);

  // add assignment modal states
  const [isModalAddOpen, setIsModalAddOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(0); //request option
  const [rangeEnd, setRangeEnd] = useState(0); //request option
  const [selectedDate3, setSelectedDate3] = useState(Date.now()); //request option
  const [response, serResponse] = useState(null); //request option
  const [previewDataAdd, setPreviewDataAdd] = useState({}); //request option

  const submitAdd = async (args) => {
    const data = await Add_Assigment(args);
    serResponse(data);
  };

  useEffect(() => {
    setPreviewDataAdd({
      employee: emp ? emp : null,
      date: selectedDate3 ? selectedDate3 : null,
      range: [rangeStart ? rangeStart : 0, rangeEnd ? rangeEnd : 0],
      total: Math.abs(rangeEnd - rangeStart),
    });
  }, [rangeStart, rangeEnd, selectedDate3, emp]);

  //edit assignment modal states
  const [isModalEditAssignOpen, setIsModalEditAssignOpen] = useState(false);
  const [C_Range, setC_Range] = useState("Select Range Option"); //request option
  const [previewEditAdd, setPreviewEditAdd] = useState({}); //request option
  const [transitionEdit, setTransitionEdit] = useState(false); //use this to make buttom ask to pull employee entrys => then select one and populate preview edit add with chosen entry button at this point says modify entry => then val 3 for tahnks for modifying...on close set to 0

  //manage employee modal states
  const [action, setAction] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeeLocation, setEmployeeLocation] = useState("");
  const [employeeTitle, setEmployeeTitle] = useState("");
  const [employeeWage, setEmployeeWage] = useState("");
  const [employeeList, setEmployeeList] = useState([]);

  const [clickedEmployee, setClickedEmployee] = useState(null);

  const init = async () => {
    const employee_list = await https.getEmployees();
    const formatted_employee_list = employee_list.map((employee) => {
      return { ...employee, focus: false };
    });
    setEmployeeList(formatted_employee_list);
  };

  const handleEmployeeAdd = async () => {
    const data = {
      name: employeeName,
      email: employeeEmail,
      phone: employeePhone,
      location: employeeLocation,
      title: employeeTitle,
      wage: employeeWage,
    };
    await https.addEmployee(data);
    setTimeout(() => {
      init();
    }, 500);
    alert("Employee Added");
  };

  const handleEmployeeDelete = async () => {
    const data = {
      employee_id: clickedEmployee.EMPLOYEE_ID,
    };
    await https.deleteEmployee(data);
    alert("Employee Deleted");
    setTimeout(() => {
      init();
    }, 500);
  };

  const onFocusEmployee = (emp) => {
    const focusEvent = employeeList.map((employee) => {
      if (employee.EMPLOYEE_ID === emp.EMPLOYEE_ID) {
        return { ...employee, focus: !employee.focus };
      } else {
        return { ...employee, focus: false };
      }
    });
    setClickedEmployee(emp.focus ? null : emp);
    setEmployeeList(focusEvent);
  };
  const tableRows = employeeList.map((employee, index) => (
    <tr
      key={employee.EMPLOYEE_ID}
      className={`${
        employee.focus
          ? "bg-yellow-500"
          : index % 2 === 0
          ? "bg-gray-100"
          : "bg-white"
      }`}
      onClick={() => onFocusEmployee(employee)}
    >
      <td className="px-4 py-2 border text-black">{employee.NAME}</td>
      <td className="px-4 py-2 border text-black bg-rose-400">
        {employee.EMPLOYEE_ID}
      </td>
      <td className="px-4 py-2 border text-black">{employee.TITLE}</td>
    </tr>
  ));

  useEffect(() => {
    init();
  }, []);

  //remove assignment modal states
  const [isModalRmAssignOpen, setIsModalRmAssignOpen] = useState(false);

  //view assignment modal states
  const [isModalViewAssignOpen, setIsModalViewAssignOpen] = useState(false);
  const [viewScheduler, setViewScheduler] = useState(false);

  const handleModalOpen = (val) => {
    if (val == "viewScheduler") {
      setViewScheduler(true);
    }
    if (val == "viewAssign") {
      setIsModalViewAssignOpen(true);
    }
    if (val == "rmAssign") {
      setIsModalRmAssignOpen(true);
    }
    if (val == "editAssign") {
      setIsModalEditAssignOpen(true);
    }
    if (val == "add") {
      setIsModalAddOpen(true);
    }
    if (val == "edit") {
      setIsModalEditOpen(true);
    }
    if (val == "rm") {
      setIsModalRmOpen(true);
    }
    if (val == "gen") {
      setIsModalGenOpen(true);
    }
    if (val == "manage") {
      setManageEmployeeModal(true);
    }
    if (val == "schedule") {
      setScheduleEmployeeModal(true);
    }
  };

  const handleModalClose = (val) => {
    if (val == "viewScheduler") {
      setViewScheduler(false);
    }
    if (val == "viewAssign") {
      setIsModalViewAssignOpen(false);
    }
    if (val == "rmAssign") {
      setIsModalRmAssignOpen(false);
    }
    if (val == "editAssign") {
      setIsModalEditAssignOpen(false);
      setEmp("Select Employee");
      setSelEmployeeData("");
      setRangeStart(0);
      setC_Range("Select Range Option");
    }

    if (val == "add") {
      setRangeStart(0);
      setRangeEnd(0);
      setEmp("Select Employee");
      setSelEmployeeData("");
      setIsModalAddOpen(false);
      setPreviewDataAdd({});
      setSelectedDate3(Date.now());
      serResponse(null);
    }
    if (val == "edit") {
      setStatus(null);
      setEmployee("Select Employee");
      setSelEmployeeData("");
      setShiftOption("Select Shift");
      setPreviewData([]);
      setSelectedDate(Date.now());
      setHours(1);
      setIsModalEditOpen(false);
    }
    if (val == "rm") {
      setRevert(false);
      setStatus(null);
      setEmployee("Select Employee");
      setSelEmployeeData("");
      setShiftOption("Select Shift");
      setPreviewData([]);
      setSelectedDate(Date.now());
      setIsModalRmOpen(false);
    }
    if (val == "gen") {
      setEmp("Select Employee");
      setPdfBlob(null);
      setSelectedDate1(Date.now());
      setSelectedDate2(Date.now());
      setIsModalGenOpen(false);
    }
    if (val == "manage") {
      setManageEmployeeModal(false);
      setEmployeeEmail("");
      setEmployeeLocation("");
      setEmployeeName("");
      setEmployeePhone("");
      setEmployeeTitle("");
      setEmployeeWage("");
      setAction(false);
      setClickedEmployee(null);
    }
    if (val == "schedule") {
      setScheduleEmployeeModal(false);
    }
  };
  // component init
  return (
    <>
      <CardGrid>
        <Card onClick={() => handleModalOpen("viewScheduler")}>
          <h2 className="text-black mb-3">Employee Scheduler</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Scheduler to handle employee shifts
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("edit")}>
          <h2 className="text-black mb-3">Edit Employee Shift</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Edit start or end shift time for a given employee
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("rm")}>
          <h2 className="text-black mb-3">Remove Employee Shift</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Remove employee shift day with a given id and date
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("gen")}>
          <h2 className="text-black mb-3">Generate Employee Work Times</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">Generate pdf files for employess</p>
          </SubComponent>
        </Card>
        {/* <Card onClick={() => handleModalOpen("add")}>
          <h2 className="text-black mb-3">Add Employee Assignment</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Add employee assignment to keep track of orders
            </p>
          </SubComponent>
        </Card> */}
        {/* <Card onClick={() => handleModalOpen("editAssign")}>
          <h2 className="text-black mb-3">Edit Employee Assignment</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Edit Employee assignment or update certain parameters
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("rmAssign")}>
          <h2 className="text-black mb-3">Remove Employee Assignment</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Remove employee assignment entry given a date
            </p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("viewAssign")}>
          <h2 className="text-black mb-3">View Employee Assignments</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              View given employee assignment within a range
            </p>
          </SubComponent>
        </Card> */}
        <Card onClick={() => handleModalOpen("manage")}>
          <h2 className="text-black mb-3">Manage Employees</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">Add, Delete, or View Employees</p>
          </SubComponent>
        </Card>
        <Card onClick={() => handleModalOpen("schedule")}>
          <h2 className="text-black mb-3">Manage Employee Schedule</h2>
          <SubComponent>
            <h3 className="text-gray-800/50">Utility</h3>
            <p className="text-gray-800/50">
              Create weekly schedule for employee{" "}
            </p>
          </SubComponent>
        </Card>
      </CardGrid>
      {/* <div className="hidden lg:block fixed bottom-0 left-0 w-full bg-red-500 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AlertCard
              title="Employee Alert"
              message="Jennifer missed today."
            />
            <AlertCard
              title="Shift Alert"
              message="Oscar changed his end shift"
            />
            <AlertCard
              title="Generation Alert"
              message="Generated Time Report for Oscar"
            />
          </div>
        </div>
      </div> */}
      {/* edit modal */}
      {isModalEditOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("edit")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">Edit Utility</ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("edit")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            {status == null ? (
              <>
                <div className="p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-b-2 border-black/20">
                  <div>
                    <p className="text-black">Select Shift Options</p>
                    <DropdownButton
                      setData={setShiftOption}
                      dataValue={shiftOption}
                      data={{ data: shiftDefault }}
                    />
                  </div>
                  <div>
                    <p className="text-black">Select Employee</p>
                    <DropdownButton
                      setData={setEmployee}
                      dataValue={employee}
                      data={{ data: local_data.emps }}
                    />
                  </div>
                  <div>
                    <p className="text-black">Select Date</p>
                    <Datepicker
                      selected={selectedDate}
                      setSelected={setSelectedDate}
                    />
                  </div>
                  <div>
                    <p className="text-black">Enter Change In Hours</p>
                    <input
                      className="text-black w-full rounded-lg border border-black/20 p-2"
                      type="number"
                      value={hours}
                      onChange={(e) => {
                        setHours(e.target.value);
                      }}
                      placeholder="Enter Hours"
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
                <div className="text-black flex justify-center items-center text-3xl mt-20">
                  <div className="w-auto h-auto text-center opacity-50">
                    {previewData.length > 0 ? (
                      <div>
                        {employee}
                        {previewData.map((obj) => {
                          if (obj.SHIFT_CHANGE == true) {
                            return (
                              <div
                                key={obj.SHIFT_DATE}
                                className="bg-red-500/80 rounded-lg"
                              >
                                {shiftOption == "end"
                                  ? obj.SHIFT_END
                                  : obj.SHIFT_START}
                              </div>
                            );
                          } else {
                            return (
                              <div key={obj.SHIFT_DATE}>
                                {shiftOption == "end"
                                  ? obj.SHIFT_END
                                  : obj.SHIFT_START}
                              </div>
                            );
                          }
                        })}
                      </div>
                    ) : (
                      <div> Loading Preview...</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 md:mt-12 lg:mt-16">
                  <button
                    className="w-full sm:w-auto rounded-lg text-black border border-3 bg-zuma-green/80 px-4 py-2 sm:mr-4 mb-4 sm:mb-0"
                    onClick={() => {
                      editPreviewData({
                        e_id: selEmployeeData,
                        date: selectedDate,
                        shiftOption: shiftOption,
                        hours: hours,
                      });
                    }}
                  >
                    Preview Change
                  </button>
                  <button
                    className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                    onClick={() => {
                      submitEdit({
                        e_id: selEmployeeData,
                        date: selectedDate,
                        shiftOption: shiftOption,
                        hours: hours,
                      });
                    }}
                  >
                    Change Shift Entry
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-900 font-bold"> Entry Changed!</div>
            )}
          </ModalContainer>
        </>
      )}
      {/* rm modal */}
      {/* //Range remove range state const [rangeOption, setRangeOption] =
      useState(false); const [rangeSelectedStart, setRangeSelectedStart] =
      useState(Date.now()) const [rangeSelectedEnd, setRangeSelectedEnd] =
      useState(Date.now()); const [revertRange, setRevertRange] =
      useState(false); */}
      {isModalRmOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("rm")} />
          <ModalContainer className="sm:w-11/12 md:w-5/6 lg:w-2/3">
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">
                Remove Shift Utility
              </ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("rm")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>

            <>
              {rangeOption == false ? (
                <>
                  {status == null ? (
                    <>
                      <div className="p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 border border-b-2 border-black/20">
                        <div>
                          <p className="text-black">Select Employee</p>
                          <DropdownButton
                            setData={setEmployee}
                            dataValue={employee}
                            data={{ data: local_data.emps }}
                          />
                        </div>
                        <div>
                          <p className="text-black">Select Date</p>
                          <Datepicker
                            selected={selectedDate}
                            setSelected={setSelectedDate}
                          />
                        </div>
                        <button
                          onClick={() => setRangeOption(!rangeOption)}
                          className="w-full sm:w-auto rounded-lg text-black border border-3 bg-zuma-green/80 px-4 py-2 sm:mr-4 mb-4 sm:mb-0"
                        >
                          <p>Select Range</p>
                        </button>
                      </div>
                      <div className="text-black flex justify-center items-center text-3xl mt-20">
                        <div className="w-auto h-auto text-center opacity-50">
                          {previewData.length > 0 ? (
                            <div>
                              {employee}
                              {previewData.map((obj) => {
                                if (
                                  obj.SHIFT_CHANGE == true &&
                                  obj.SHIFT_DATE == "Called Off"
                                ) {
                                  return (
                                    <div
                                      className="flex items-center"
                                      key={obj.SHIFT_DATE}
                                    >
                                      <div
                                        key={obj.SHIFT_DATE}
                                        className="bg-red-500/80 rounded-lg mr-2 py-1 px-2"
                                      >
                                        {obj.SHIFT_DATE}
                                      </div>
                                      <Slider
                                        value={revert}
                                        onChange={setRevert}
                                      />
                                      <div className="text-lg">
                                        Revert Shift Removal
                                      </div>
                                    </div>
                                  );
                                } else if (obj.SHIFT_CHANGE == true) {
                                  return (
                                    <div
                                      key={obj.SHIFT_DATE}
                                      className="bg-red-500/80 rounded-lg"
                                    >
                                      {obj.SHIFT_DATE}
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={obj.SHIFT_DATE}>
                                      {obj.SHIFT_DATE}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          ) : (
                            <div> Loading Preview...</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 lg:mt-16">
                        {!revert && (
                          <button
                            className="w-full sm:w-auto rounded-lg text-black border border-3 bg-zuma-green/80 px-4 py-2 sm:mr-4 mb-4 sm:mb-0"
                            onClick={() => {
                              removePreviewData({
                                e_id: selEmployeeData,
                                date: selectedDate,
                                shiftOption: shiftOption,
                                hours: hours,
                              });
                            }}
                          >
                            Preview Change
                          </button>
                        )}
                        <button
                          className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                          onClick={() => {
                            submitRemove({
                              e_id: selEmployeeData,
                              date: selectedDate,
                              shiftOption: shiftOption,
                              hours: hours,
                              revert: revert,
                            });
                          }}
                        >
                          {revert
                            ? "Revert Modified Entry"
                            : "Remove Shift Entry"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-900 font-bold">
                      {" "}
                      {revert
                        ? "Reverted Removal Of Entry"
                        : "Removed Shift Entry!"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {" "}
                  <div className="p-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 border border-b-2 border-black/20">
                    <div>
                      <p className="text-black">Select Employee</p>
                      <DropdownButton
                        setData={setEmployee}
                        dataValue={employee}
                        data={{ data: local_data.emps }}
                      />
                    </div>
                    <div>
                      <p className="text-black">Select Start Date</p>
                      <Datepicker
                        selected={rangeSelectedStart}
                        setSelected={setRangeSelectedStart}
                      />
                    </div>
                    <div>
                      <p className="text-black">Select End Date</p>
                      <Datepicker
                        selected={rangeSelectedEnd}
                        setSelected={setRangeSelectedEnd}
                      />
                    </div>
                    <button
                      onClick={() => setRangeOption(!rangeOption)}
                      className="w-full sm:w-auto rounded-lg text-black border border-3 bg-zuma-green/80 px-4 py-2 sm:mr-4 mb-4 sm:mb-0"
                    >
                      <p>Select Single Date</p>
                    </button>
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center">
                        <span className="text-black mr-2">Revert</span>
                        <input
                          type="checkbox"
                          checked={revertRange}
                          onChange={(e) => setRevertRange(e.target.checked)}
                          className="appearance-none w-12 h-6 rounded-full bg-gray-300 checked:bg-zuma-green/80 relative transition-all duration-200"
                          style={{
                            backgroundImage: revertRange
                              ? "linear-gradient(to right, #22c55e, #16a34a)"
                              : undefined,
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <>
                    <button
                      onClick={() => {
                        https.setRemoveRange({
                          revert: revertRange,
                          startDate: rangeSelectedStart,
                          endDate: rangeSelectedEnd,
                          e_id: selEmployeeData,
                        });
                        window.alert(
                          revertRange
                            ? "Successfully reverted range of shift entries."
                            : "Successfully removed range of shift entries."
                        );
                      }}
                      className="flex justify-center items-center mt-8 rounded-lg text-black border border-3 bg-orange-200 px-4 py-2 sm:mr-4 mb-4 sm:mb-0"
                    >
                      {" "}
                      Submit Range Of Dates
                    </button>
                  </>
                </>
              )}
            </>
          </ModalContainer>
        </>
      )}
      {/* gen modal */}
      {isModalGenOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("gen")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">Generate Utility</ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("gen")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-b-2 border-black/20">
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Employee</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.gen_emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Start Date</p>
                <Datepicker
                  selected={selectedDate1}
                  setSelected={setSelectedDate1}
                />
              </div>
              <div>
                <p className="text-black">Select End Date</p>
                <Datepicker
                  selected={selectedDate2}
                  setSelected={setSelectedDate2}
                />
              </div>
            </div>

            <PdfViewer fileBlob={pdfBlob} />
            <div className="flex justify-center items-center mt-8 md:mt-20 mb-8 md:mb-20">
              <button
                className="bg-zuma-green text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-zuma-green-dark focus:ring-opacity-50"
                onClick={() => {
                  gen_pdf({
                    e_id: empData,
                    date1: selectedDate1,
                    date2: selectedDate2,
                  });
                }}
              >
                Generate PDF
              </button>
            </div>
          </ModalContainer>
        </>
      )}
      {/* add assignment modal */}
      {isModalAddOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("add")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">Assignment Utility</ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("add")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            {response == null ? (
              <>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-b-2 border-black/20">
                  <div className="mb-4 md:mb-0">
                    <p className="text-black">Select Employee</p>
                    <DropdownButton
                      setData={setEmp}
                      dataValue={emp}
                      data={{ data: local_data.emps }}
                    />
                  </div>
                  <div className="mb-4 md:mb-0">
                    <p className="text-black">Select Date</p>
                    <Datepicker
                      selected={selectedDate3}
                      setSelected={setSelectedDate3}
                    />
                  </div>
                  <div>
                    <label className="text-black">Enter Start Range</label>
                    <input
                      type={"number"}
                      className="text-black rounded-lg border border-black/20 p-2"
                      value={rangeStart}
                      onChange={(e) => {
                        setRangeStart(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-black">Enter End Range</label>
                    <input
                      type={"number"}
                      className="text-black rounded-lg border border-black/20 p-2"
                      value={rangeEnd}
                      onChange={(e) => {
                        setRangeEnd(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="text-black flex justify-center items-center text-3xl mt-20 mb-5">
                  <div className="w-auto h-auto text-center opacity-50">
                    <div className="text-black">
                      <div className="bg-zuma-green py-2 px-2 rounded-lg">
                        Employee: {previewDataAdd.employee},
                      </div>
                      <div className="bg-zuma-green/70 py-2 px-2 rounded-lg">
                        Range: {previewDataAdd.range[0]} to{" "}
                        {previewDataAdd.range[1]}
                      </div>
                      <div className="bg-zuma-green/50 py-2 px-2 rounded-lg">
                        Total Orders: {previewDataAdd.total}
                      </div>
                      <div className="bg-zuma-green/50 py-2 px-2 rounded-lg">
                        Entry Date:{" "}
                        {new Date(previewDataAdd.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 lg:mt-16">
                  <button
                    className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2 mb-4"
                    onClick={() => {
                      submitAdd({
                        e_id: empData,
                        date: selectedDate3,
                        rangeStart,
                        rangeEnd,
                      });
                    }}
                  >
                    Add Assignment
                  </button>
                </div>
              </>
            ) : (
              <div> Assignment added for the employee!</div>
            )}
          </ModalContainer>
        </>
      )}
      {/* edit add assignment modal */}
      {isModalEditAssignOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("editAssign")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">
                Edit Assignment Utility
              </ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("editAssign")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-b-2 border-black/20">
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Employee</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Range Option</p>
                <DropdownButton
                  setData={setC_Range}
                  dataValue={C_Range}
                  data={{ data: local_data.emp_option }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Date</p>
                <Datepicker
                  selected={selectedDate3}
                  setSelected={setSelectedDate3}
                />
              </div>
              <div>
                <label className="text-black">Enter New Range</label>
                <input
                  type={"number"}
                  className="text-black rounded-lg border border-black/20 p-2"
                  value={rangeStart}
                  onChange={(e) => {
                    setRangeStart(e.target.value);
                  }}
                />
              </div>
            </div>
            {/* preview data */}

            <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 lg:mt-16">
              {!transitionEdit ? (
                <button
                  className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                  onClick={() => {
                    submitRemove({
                      e_id: selEmployeeData,
                      date: selectedDate,
                      shiftOption: shiftOption,
                      hours: hours,
                    });
                  }}
                >
                  Get Employee Assign Entries
                </button>
              ) : (
                <button
                  className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                  onClick={() => {
                    submitRemove({
                      e_id: selEmployeeData,
                      date: selectedDate,
                      shiftOption: shiftOption,
                      hours: hours,
                    });
                  }}
                >
                  Change Assignment Range
                </button>
              )}
            </div>
          </ModalContainer>
        </>
      )}
      {/* remove assignment modal */}
      {isModalRmAssignOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("rmAssign")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">
                Remove Assignment Utility
              </ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("rmAssign")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-b-2 border-black/20">
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Employee</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Range Option</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Date</p>
                <Datepicker
                  selected={selectedDate3}
                  setSelected={setSelectedDate3}
                />
              </div>
              <div>
                <label className="text-black">Enter New Range</label>
                <input
                  type={"number"}
                  className="text-black  rounded-lg border border-black/20 p-2"
                  value={rangeStart}
                  onChange={(e) => {
                    setRangeStart(e.target.value);
                  }}
                />
              </div>
            </div>
            {/* preview data useEffect*/}

            <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 lg:mt-16">
              <button
                className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                onClick={() => {
                  submitRemove({
                    e_id: selEmployeeData,
                    date: selectedDate,
                    shiftOption: shiftOption,
                    hours: hours,
                  });
                }}
              >
                Change Shift Entry
              </button>
            </div>
          </ModalContainer>
        </>
      )}
      {/* view assignment modal */}
      {isModalViewAssignOpen && (
        <>
          <ModalBackground onClick={() => handleModalClose("viewAssign")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">
                View Assignment Utility
              </ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("viewAssign")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-b-2 border-black/20">
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Employee</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Range Option</p>
                <DropdownButton
                  setData={setEmp}
                  dataValue={emp}
                  data={{ data: local_data.emps }}
                />
              </div>
              <div className="mb-4 md:mb-0">
                <p className="text-black">Select Date</p>
                <Datepicker
                  selected={selectedDate3}
                  setSelected={setSelectedDate3}
                />
              </div>
              <div>
                <label className="text-black">Enter New Range</label>
                <input
                  type={"number"}
                  className="text-black rounded-lg border border-black/20 p-2"
                  value={rangeStart}
                  onChange={(e) => {
                    setRangeStart(e.target.value);
                  }}
                />
              </div>
            </div>
            {/* preview data useEffect*/}

            <div className="flex flex-col sm:flex-row justify-center items-center sm:mt-8 lg:mt-16">
              <button
                className="w-full sm:w-auto rounded-lg text-black border border-3 bg-orange-500/80 px-4 py-2"
                onClick={() => {
                  submitRemove({
                    e_id: selEmployeeData,
                    date: selectedDate,
                    shiftOption: shiftOption,
                    hours: hours,
                  });
                }}
              >
                Change Shift Entry
              </button>
            </div>
          </ModalContainer>
        </>
      )}
      {/* {"manageEmployee"} */}
      {manageEmployeeModal && (
        <>
          <ModalBackground onClick={() => handleModalClose("manage")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">Manage Employees</ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("manage")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="max-h-[75vh] overflow-y-auto rounded border text-black">
              <table className="min-w-full table-fixed text-sm">
                <thead className="bg-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 border w-1/4 text-left">Name</th>
                    <th className="px-4 py-2 border w-1/4 text-left">ID</th>
                    <th className="px-4 py-2 border w-1/4 text-left">Title</th>
                    <th className="px-2 py-2 border w-12 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ Employee Rows */}
                  {tableRows}

                  {/* ✅ Delete Confirmation Row */}
                  {clickedEmployee !== null && (
                    <tr className="bg-red-50 text-black">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span>
                            Are you sure you want to delete this employee?
                          </span>
                          <div className="space-x-2">
                            <button
                              onClick={() => {
                                handleEmployeeDelete();
                                setClickedEmployee(null);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setClickedEmployee(null)}
                              className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* ✅ Add Inline Form */}
                  {!showAddForm ? (
                    <tr>
                      <td colSpan={4} className="text-center py-3">
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          + Add Employee
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr className="bg-gray-50">
                      <td colSpan={4}>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              ["Full Name", employeeName, setEmployeeName],
                              ["Email", employeeEmail, setEmployeeEmail],
                              ["Phone", employeePhone, setEmployeePhone],
                              ["Title", employeeTitle, setEmployeeTitle],
                              ["Wage", employeeWage, setEmployeeWage],
                              [
                                "Location ID",
                                employeeLocation,
                                setEmployeeLocation,
                              ],
                            ].map(([label, val, setFn], idx) => (
                              <div key={idx}>
                                <label className="block text-sm font-medium text-black mb-1">
                                  {label}
                                </label>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => setFn(e.target.value)}
                                  className="w-full px-3 py-2 border rounded-md text-black border-gray-300"
                                  placeholder={label}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                handleEmployeeAdd();
                                setShowAddForm(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                            >
                              Submit
                            </button>
                            <button
                              onClick={() => setShowAddForm(false)}
                              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ModalContainer>
        </>
      )}
      {scheduleEmployeeModal && (
        <>
          <ModalBackground onClick={() => handleModalClose("schedule")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">
                Manage Employee Schedule
              </ModalTitle>
              <ModalCloseButton onClick={() => handleModalClose("schedule")}>
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <div className="flex flex-1 justify-center items-center w-full">
              <div className="p-6 bg-white rounded-lg shadow max-w-4xl w-full">
                <div className="mb-4">
                  <label
                    htmlFor="employee-select"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Employee
                  </label>
                  <select
                    id="employee-select"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    {scheduleEmployees.map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {daysOfWeek.map((day) => (
                          <th
                            key={day}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 ">
                      <tr>
                        {daysOfWeek.map((day) => (
                          <td key={day} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex flex-col">
                                <input
                                  type="number"
                                  placeholder="Start"
                                  value={schedule[day].start}
                                  onChange={handleScheduleChange(day, "start")}
                                  className="mb-2 mt-1 h-10 px-3 rounded border border-gray-300 text-black"
                                />
                                <input
                                  type="number"
                                  placeholder="End"
                                  value={schedule[day].end}
                                  onChange={handleScheduleChange(day, "end")}
                                  className="mb-1 h-10 px-3 rounded border border-gray-300 text-black"
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => handleSubmit()}
                  className="mt-4 w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Submit Schedule
                </button>
              </div>
            </div>
          </ModalContainer>
        </>
      )}
      {viewScheduler && (
        <>
          <ModalBackground onClick={() => handleModalClose("viewScheduler")} />
          <ModalContainer>
            <ModalHeader className="sticky top-0 z-10 bg-white">
              <ModalTitle className="text-black">Scheduler Utility</ModalTitle>
              <ModalCloseButton
                onClick={() => handleModalClose("viewScheduler")}
              >
                <FaTimes className="w-5 h-5 mr-2" />
              </ModalCloseButton>
            </ModalHeader>
            <select
              id="employee-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black bg-gray-200"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ marginBottom: "0.25rem" }}
            >
              {scheduleEmployees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
            <MyCalendar
              employee={scheduleEmployees.find(
                (emp) => emp.name === selectedEmployee
              )}
            />
          </ModalContainer>
        </>
      )}
    </>
  );
};

export default Employee;
