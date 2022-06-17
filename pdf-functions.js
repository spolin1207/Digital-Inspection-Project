const fs = require("fs");

var getPDFDocument = module.exports.getPDFDocument = async function (filepath) {
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

  // Some PDFs need external cmaps.
  const CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.8.335/cmaps/";
  const CMAP_PACKED = true;

  // Loading file from file system into typed array.
  const pdfPath = filepath;
  const data = new Uint8Array(fs.readFileSync(pdfPath));

  // Load the PDF file.
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
  });

  var pdfDocument = loadingTask.promise;

  return pdfDocument;
};

var getPDFAttachments = module.exports.getPDFAttachments = async function (pdfDocument) {
  var pdfAttachments = pdfDocument.getAttachments();

  return pdfAttachments;
};

var convertAttachments = module.exports.convertAttachments = async function (pdfAttachments) {
  var attachments = [];

  for (const [key, value] of Object.entries(pdfAttachments)) {
    var attpath = key;
    var filename = attpath.split("/").pop();
    var extension = attpath.split(".").pop();

    attachments.push({
      name: filename,
      type: extension,
      content: new TextDecoder().decode(value.content),
    });
  }

  return attachments;
};
