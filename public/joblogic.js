// Creates the inspection table containing items, dimensions, and sample values
function CreateInspectionTable() {
  const jstring = document.getElementById("jsondata").innerHTML;
  const json = JSON.parse(jstring);


  // Builds this table if JSON contains sample data/inspections
  if (json.hasOwnProperty("inspections")) {
    var tableHead = document.getElementById("InspectionRows");
    tableHead.innerHTML = "";
    tableHead.innerHTML += "<th>Item</th>";
    tableHead.innerHTML += "<th>Dimension</th>";
    // Add Sample Columns
    for (var i = 0; i < json.inspections.length; i++) {
      tableHead.innerHTML += `<th>Sample ${i + 1}</th>`
    }
    // Add items and dimensions
    var tableBody = document.getElementById("InspectionBody");
    for (var i = 0; i < json.pages.length; i++) {
      for (var j = 0; j < json.pages[i].items.length; j++) {
        var row = `
        <tr>
          <td>${json.pages[i].items[j].Order}</td>
          <td>${json.pages[i].items[j].DimNom}</td>
        `;
        console.log(json.inspections.length);
        for (var k = 0; k < json.inspections.length; k++) {
          row += `<td style="color: blue" onclick="ItemTable([${json.pages[i].items[j].Order}, this.innerHTML, ${k + 1}])">No Value</td>`
        }
        

        row += "</tr>";
        tableBody.innerHTML += row;
      }
    }

    // Adds measurement values from the JSON to the appropriate spot in the table
    for (var i = 0; i < json.pages.length; i++) {
      for (var j = 0; j < json.pages[i].items.length; j++) {
        if (json.pages[i].items[j].hasOwnProperty("MeasurementValues")) {
          for (var k = 0; k < json.pages[i].items[j].MeasurementValues.length; k++) {
            var rowIndex = json.pages[i].items[j].Order - 1;
            var columnIndex = json.pages[i].items[j].MeasurementValues[k].sampleset;
            columnIndex++;
            console.log(tableBody.rows[rowIndex].cells[columnIndex].innerHTML);
            tableBody.rows[rowIndex].cells[columnIndex].innerHTML = json.pages[i].items[j].MeasurementValues[k].measurement;
          }
        }
      }
    }

    
  } else { // Builds this table if JSON has not sample data/inspections
    for (var i = 0; i < json.pages.length; i++) {
      for (var j = 0; j < json.pages[i].items.length; j++) {
        var row = `
        <tr>
          <td>${json.pages[i].items[j].Order}</td>
          <td>${json.pages[i].items[j].DimNom}</td>
        </tr>`;
        tableBody.innerHTML += row;
      }
    }
  }

  
}
CreateInspectionTable();

// Populates Item Table with information based on what ID is selected in Inspection Table
function ItemTable(object) {
  const jstring = document.getElementById("jsondata").innerHTML;
  const json = JSON.parse(jstring);
  console.log(object);

  document.getElementById("measurement").value = object[1];
  document.getElementById("sampleset").innerHTML = object[2];

  for (var i = 0; i < json.pages.length; i++) {
    for (var j = 0; j < json.pages[i].items.length; j++) {
      if (json.pages[i].items[j].Order == object[0]) {
        document.getElementById("item").innerHTML = json.pages[i].items[j].Order;
        document.getElementById("dimension").innerHTML = json.pages[i].items[j].DimNom;
        document.getElementById("plustol").innerHTML = json.pages[i].items[j].Tol_Max;
        document.getElementById("negtol").innerHTML = json.pages[i].items[j].Tol_Min;
        document.getElementById("upperlimit").innerHTML = json.pages[i].items[j].Limit_Max;
        document.getElementById("lowerlimit").innerHTML = json.pages[i].items[j].Limit_Min;
        document.getElementById("method").innerHTML = json.pages[i].items[j].Method;
        document.getElementById("type").innerHTML = json.pages[i].items[j].InspType;
      }
    }
  }
}

// Adds new row to collect sample information into the JSON
function NewSample() {
  const jstring = document.getElementById("jsondata").innerHTML;
  const json = JSON.parse(jstring);

  if (json.hasOwnProperty('inspections')) {
    json.inspections.push({
      id: json.inspections.length + 1,
      created: new Date().toLocaleDateString(),
      modified: new Date().toLocaleDateString(),
      operator: ""
    });
  } else {
    json["inspections"] = [];
    json.inspections.push({
      id: 1,
      created: new Date().toLocaleDateString(),
      modified: new Date().toLocaleDateString(),
      operator: ""
    });
    
  }

  document.getElementById("jsondata").innerHTML = JSON.stringify(json);
  CreateInspectionTable();
}

// Saves measurements and operator id to the JSON
function SaveMeasurement() {
  const jstring = document.getElementById("jsondata").innerHTML;
  const json = JSON.parse(jstring);
  const item = document.getElementById("item").innerHTML;
  const sampleset = document.getElementById("sampleset").innerHTML;
  const date = new Date().toLocaleDateString();
  const operator = document.getElementById("operator").innerHTML;
  const measurement = document.getElementById("measurement").innerHTML;

  var object = {
    sampleset: sampleset,
    by: operator,
    date: date,
    measurement: measurement
  }

  for (var i = 0; i < json.pages.length; i++) {
    for (var j = 0; j < json.pages[i].items.length; j++) {
      if (json.pages[i].items[j].Order == item) {
        if (json.pages[i].items[j].hasOwnProperty("MeasurementValues")) {
          json.pages[i].items[j].MeasurementValues[sampleset - 1] = object;
        } else {
          json.pages[i].items[j].MeasurementValues = [];
          json.pages[i].items[j].MeasurementValues.push(object);
        }
      }
    }
  }
  document.getElementById("jsondata").innerHTML = JSON.stringify(json);
  CreateInspectionTable();  
}

// Pipes in the correct pdf based on Job ID
const jobNumber = document.getElementById("jobdata").innerHTML.trim();
var path = "/web/viewer.html?file=/jobpdf/" + jobNumber;
document.getElementById("pdf-js-viewer").src = path;

// Toggles Side Menu
var NavToggle = 0;
function toggleNav() {
  if (NavToggle == 0) {
    NavToggle = 1;
    document.getElementById("PartOptions").style.width = "23px";
    document.getElementById("PartInformation").style.marginLeft = "23px";
  } else {
    NavToggle = 0;
    document.getElementById("PartOptions").style.width = "300px";
    document.getElementById("PartInformation").style.marginLeft = "300px";
  }
}

document.addEventListener("pagechanging", function (e) {
  if (e.pageNumber !== e.previousPageNumber) {
    console.log(
      "page changed from " + e.previousPageNumber + " to " + e.pageNumber
    );
  }
});

// Saves JSON to the database via POST request
function SaveData() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/updatejson');


  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
    console.log(xhr.status);
    console.log(xhr.responseText);
  }};

  var formData = new FormData();
  var json = document.getElementById("jsondata").innerHTML;
  var job = document.getElementById("jobdata").innerHTML;
  formData.append('job', job);
  formData.append('data', json);

  xhr.send(formData);
}
