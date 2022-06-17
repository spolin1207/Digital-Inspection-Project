const express = require("express");
const fs = require("fs");
const sql = require("mssql");
const csiAPI = require("./CSI");
const PBC_SQL = require("./sql");
const pdfFunctions = require("./pdf-functions");
const formData = require("express-form-data");

const SSE_RESPONSE_HEADER = {
  Connection: "keep-alive",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
};
const app = express();

// formData
app.use(formData.parse());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.listen(5000);

// Prevent 304
app.disable("etag");

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/web"));

// Database Configuration
const config = {
  user: "sa",
  password: "",
  server: "CONFIG-FR",
  database: "WebInspect",
  options: {
    encrypt: false,
    trustedConnection: true,
  },
};

// Home Page
app.get("/", async (req, res) => {
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .query(
      `SELECT TOP (1000) [job],[job_details],[files],[inspections] FROM [digital_inspection];`
    );

  var files = [];
  for (var i = 0; i < result.recordset.length; i++) {
    files.push(result.recordset[i].files);
  }

  for (var j = 0; j < files.length; j++) {
    if (files[j] != null && (files[j].includes('PDF') || files[j].includes('pdf'))) {
        files[j] = files[j].replace(/^.*[\\\/]/, '');
        files[j] = files[j].substring(0, files[j].length - 2);
    } else {
      files[j] = "No Job Files Available";
    }
  }  

  res.render("MainPage", {
    data: {
      results: result,
      files: files
    },
  });
});

app.get("/job/", async (req, res) => {
  res.render("InvalidJob");
});

// Job View Page
app.get("/job/:id", async (req, res) => {
  // Obtain list of jobs from database
  let pool = await sql.connect(config);
  let result = await pool
    .request()
    .query(
      `SELECT TOP (1000) [job],[job_details],[files],[inspections] FROM [digital_inspection];`
    );

  const jobNumber = req.params.id;
  var filepath =
    "\\\\pbc-vault\\PBC Applications\\_Inspection\\files" + `\\${jobNumber}`;
  var job = "";

  fs.readdir(filepath, async (err, files) => {
    // If file path is not found the job does not exist
    if (err) {
      res.render("InvalidJob");
      return console.log(err);
    }
    // Append file name to the path
    filepath += `\\${files[0]}`;

    // Assign job object based on request parameter
    for (var i = 0; i < result.recordset.length; i++) {
      if (jobNumber == result.recordset[i].job) {
        job = result.recordset[i];
      }
    }

    // If no job is assigned or pdf information not found, job cannot be displayed
    if (job == "" || !filepath.includes(".PDF")) {
      res.render("InvalidJob");
    } else {
      // Get pdf from path, extract json from attachments, parse JSON content
      const pdf = await pdfFunctions.getPDFDocument(filepath);
      const attatchments = await pdfFunctions.getPDFAttachments(pdf);
      var file = await pdfFunctions.convertAttachments(attatchments);
      // var json = JSON.parse(file[0].content);
      const json = require('./FAIR_Output_Real.json');

      // let pool = await sql.connect(config);
      // let result = await pool.request().input('job', sql.NVarChar, jobNumber).query(
      //   `SELECT * from digital_inspection
      //   WHERE job = @job`
      // );

      // try {
      //   json = JSON.parse(result.recordset[0].inspections);
      //   console.log('JSON pulled from database');
      // } catch (err) {
      //   json = JSON.parse(file[0].content);
      //   console.log('JSON pulled from pdf extraction');
      // }

      res.render("JobView", {
        data: {
          job: job,
          inspection: json,
        },
      });
    }
  });
});

// Pipes in the pdf so it can be displayed in the iFrame on the job view portion of site
app.get("/jobpdf/:id", async (req, res) => {
  const jobNumber = req.params.id;
  var filepath =
    "\\\\pbc-vault\\PBC Applications\\_Inspection\\files" + `\\${jobNumber}`;
  fs.readdir(filepath, async (err, files) => {
    // If file path is not found the job does not exist
    if (err) {
      res.send(err.message);
      return console.log(err);
    }
    // Append file name to the path
    filepath += `\\${files[0]}`;

    res.sendFile(filepath);
  });
});

// Update JSON
app.post('/updatejson', async function (req, res) {
  var jobNumber = req.body.job.trim();
  var json = JSON.stringify(JSON.parse(req.body.data));

  let pool = await sql.connect(config);
  let result = await pool.request()
    .input('job', sql.NVarChar, jobNumber)
    .input('inspections', sql.NVarChar, json)
    .query(`
      UPDATE digital_inspection
      SET inspections = @inspections
      WHERE job = @job;
    `);

    console.log('JSON saved to database');
});

app.get("/pdf/:id", async (req, res) => {
  const pdfPath = __dirname + "\\public\\0_PlainBearing.PDF";

  var pdfDocument = await pdfFunctions.getPDFDocument(pdfPath);
  var pdfAttachments = await pdfFunctions.getPDFAttachments(pdfDocument);
  var pdfCAttachments = await pdfFunctions.convertAttachments(pdfAttachments);

  fs.writeFile(
    __dirname + "\\public\\eViewer.html",
    pdfCAttachments[1].content,
    function (err) {
      if (err) return console.log(err);
    }
  );

  var JSONFile = JSON.parse(pdfCAttachments[0].content);
  var eDrawingsFile = pdfCAttachments[1].content;

  res.redirect("/eViewer.html");
});

app.post("/job/add", async (req, res) => {
  // Get form data
  // Job Number
  var JobNumber = req.body.job_number;

  // Files
  var JobFiles = [];
  if (req.files.hasOwnProperty("files")) {
    if (Array.isArray(req.files.files)) {
      JobFiles = req.files.files;
    } else {
      JobFiles = [req.files.files];
    }
  }

  // Check if Job exists in DB
  var sqlresults = await PBC_SQL.getFromDB(JobNumber);
  if (sqlresults.recordset.length > 0) {
    // Job already exists...
    console.log("Job already exists");
  }

  // Check if Job exists in CSI
  // ToDo

  // Save PDF(s) to network
  var filePaths = [];
  try {
    for (var i = 0; i < JobFiles.length; i++) {
      let thisfile = JobFiles[i];
      console.log("File " + i + ": " + thisfile.name);
      var dir =
        "\\\\pbc-vault\\PBC Applications\\_Inspection\\files\\" + JobNumber;
      let nfile = dir + "\\" + thisfile.name;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.copyFile(thisfile.path.replace(/\\\\/g, "\\"), nfile, () => {});

      // extract JSON and HTML files?

      filePaths.push(nfile);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }

  // Add Job to DB
  var sqlResults = await PBC_SQL.saveToDB(
    JobNumber,
    "",
    JSON.stringify(filePaths),
    ""
  );
  console.log("SQL Results: ", sqlResults);

  res.send({ status: true, message: "Thanks!" });
});

app.get("/job/lookup/:id", async (req, res) => {
  var results = await PBC_SQL.getFromDB(req.params.id);
  console.log("Lookup " + req.params.id + ": ", results);

  res.send({ status: true, message: "Thanks!" });
});

app.get("/job/delete/:id", async (req, res) => {
  //var results = await PBC_SQL.getFromDB();
  //console.log("results: " + results);

  console.log("Delete");

  res.send({ status: true, message: "Thanks!" });
});
