import { promises as fs } from "fs";
import PDFParser from "pdf2json";

const { writeFile } = fs;

let pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", (errData) =>
	console.error(errData.parserError)
);
pdfParser.on("pdfParser_dataReady", (pdfData) => {
	console.log(222, JSON.stringify(pdfData))
	writeFile("../data/test.json", JSON.stringify(pdfData, null, 2));
});

pdfParser.loadPDF("../data/2020-06-28.pdf");
