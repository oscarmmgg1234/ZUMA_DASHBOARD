const express = require("express");
const server = express();
const env_data = require("./env.json");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const { request } = require("./models/models_interface/request_interface");
const { employee } = require("./workers/employee_interface/employee_interface");
var bodyParser = require("body-parser");
const { connect } = require("http2");

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
};

const request_model = new request();
const Employee = new employee();
server.timeout = env_data.server_timeout;
bodyParser.urlencoded({ extended: false });
server.use(bodyParser.json());
server.use(cors());

//middleware
server.use("/EmployeeResourcesAPI/GeneratePDF", (req, res, next) => {
  request_model.gen_pdf(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else {
    res.send("request invalid").end();
  }
});
server.use(
  "/EmployeeResourcesAPI/FetchEmployeeAssignEntries",
  (req, res, next) => {
    request_model.preview_assign_edit(req.body, (data) => {
      req.request_model = data;
    });
    next();
  }
);
server.use("/EmployeeResourcesAPI/addAssignment", (req, res, next) => {
  request_model.add_assign(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else {
    res.send("request invalid").end();
  }
});
server.use("/EmployeeResourcesAPI/RemoveShift", (req, res, next) => {
  request_model.remove_s(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else {
    res.send("request invalid").end();
  }
});

server.use("/EmployeeResourcesAPI/TansformEndShift", (req, res, next) => {
  request_model.preview_s(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else {
    res.send("request invalid").end();
  }
});

server.use("/EmployeeResourcesAPI/TansformStartShift", (req, res, next) => {
  request_model.preview_s(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else {
    res.send("request invalid").end();
  }
});
server.use("/EmployeeResourcesAPI/PreviewRemoveShift", (req, res, next) => {
  request_model.preview_s(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else res.send("request invalid").end();
});
server.use(
  "/EmployeeResourcesAPI/PreviewTansformStartShift",
  (req, res, next) => {
    request_model.preview_s(req.body, (data) => {
      req.request_model = data;
    });
    if (req.request_model.validate()) {
      next();
    } else res.send("request invalid").end();
  }
);
server.use(
  "/EmployeeResourcesAPI/PreviewTansformEndShift",
  (req, res, next) => {
    request_model.preview_s(req.body, (data) => {
      req.request_model = data;
    });
    if (req.request_model.validate()) {
      next();
    } else res.send("request invalid").end();
  }
);
server.use("/EmployeeResourcesAPI/Generate_Time_sheet", (req, res, next) => {
  request_model.pdf_r_model(req.body, (data) => {
    req.request_model = data;
  });
  if (req.request_model.validate()) {
    next();
  } else res.send("request invalid").end();
});
server.use(
  "/EmployeeResourcesAPI/Generate_Time_sheet_all",
  (req, res, next) => {
    request_model.pdf_r_model(req.body, (data) => {
      req.request_model = data;
    });
    if (req.request_model.validate_multiple()) {
      next();
    } else res.send("request invalid").end();
  }
);
server.use("/EmployeeResourcesAPI/GPETS", (req, res, next) => {
  req.request_model = request_model.e_r_model(req.body);
  if (req.request_model.validate()) {
    next();
  } else res.send("request invalid").end();
});

//methods
server.post("/EmployeeResourcesAPI/Zuma_Employees", async (req, res) => {
  await Employee.g_z_employees((data) => {
    res.send(data);
  });
});

server.post("/EmployeeResourcesAPI/GPETS", async (req, res) => {
  await Employee.e_json_data(req.request_model, (data) => res.send(data));
});

server.post("/EmployeeResourcesAPI/Generate_Time_sheet", async (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  await Employee.gen_pdf(req.request_model)
    .then(async (pdf) => {
      res.send(Buffer.from(pdf, "base64"));
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

server.post(
  "/EmployeeResourcesAPI/Generate_Time_sheet_all",
  async (req, res) => {
    res.setHeader("Content-Type", "application/pdf");
    await Employee.gen_pdf_all(req.request_model)
      .then(async (pdf) => {
        res.send(Buffer.from(pdf, "base64"));
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  }
);

server.post("/EmployeeResourcesAPI/StartShift", (req, res) => {
  Employee.e_i_s_shift([
    req.body.employee_id,
    req.body.start_time,
    req.body.entry_date,
  ]);
  res.send("okay");
});

server.post("/EmployeeResourcesAPI/EndShift", (req, res) => {
  Employee.e_i_e_shift([
    req.body.employee_id,
    req.body.end_time,
    req.body.entry_date,
  ]);
  res.send("okay");
});

server.post("/EmployeeResourcesAPI/TansformEndShift", (req, res) => {
  Employee.trans_e_s(req.request_model);
  res.send({ status: "updated" });
});

server.post("/EmployeeResourcesAPI/TansformStartShift", (req, res) => {
  Employee.trans_s_s(req.request_model);
  res.send({ status: "updated" });
});

server.post("/EmployeeResourcesAPI/RemoveShift", (req, res) => {
  Employee.rm_shift(req.request_model);
  res.send({ status: "removed" });
});

server.post("/EmployeeResourcesAPI/PreviewRemoveShift", (req, res) => {
  Employee.prev_rm_shift(req.request_model, (data) => {
    res.send(data);
  });
});

server.post(
  "/EmployeeResourcesAPI/PreviewTansformStartShift",
  async (req, res) => {
    await Employee.prev_s_s(req.request_model, (data) => {
      res.send(data);
    });
  }
);
server.post(
  "/EmployeeResourcesAPI/PreviewTansformEndShift",
  async (req, res) => {
    await Employee.prev_e_s(req.request_model, (data) => {
      res.send(data);
    });
  }
);

server.post("/EmployeeResourcesAPI/addAssignment", (req, res) => {
  Employee.add_assign(req.request_model, (data) => {});
  res.send({ status: "added" });
});

server.post("/EmployeeResourcesAPI/FetchEmployeeAssignEntries", (req, res) => {
  Employee.prev_edit_assign(req.request_model, (data) => {
    res.send(data);
  });
});

//poll
server.listen(env_data.server_port, () => {
  console.log(`Example  server listening on port ${env_data.server_port}`);
});
