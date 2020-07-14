/**
 * Converts a zip TXT to JSON format.
 */

import { fileURLToPath } from 'url';
import { dirname, normalize } from 'path';

import { parseJSON } from "./utils.js";

const [node, file, date] = process.argv;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { promises as fs } from "fs";

const { readFile, writeFile } = fs;

function isZipCode(str) {
	return !!str.match(/^[0-9]{5}$/);
}

function isCaseCount(str) {
	return !!str.match(/^[0-9\,]+$/);
}

function getCountyName(str) {
	const [fullMatch, countyName] = str.match(/^(\w+)\sCounty$/) || [];
	return countyName;
}

function isPrivateProp(keyName) {
	return keyName.startsWith('_');
}

// Removes props added to accumulator while iterating through line input.
function removePrivateProps(objRaw) {
	//const obj = {...objRaw};

	const obj = Object.entries(objRaw).reduce((accum, [key, val]) => {
		if (!isPrivateProp(key)) {
			accum[key] = val;
		}

		return accum;
	}, {});

	return obj;
}

/**
 * Converts an input zip file 2020-01-01.txt to 2020-01-01.json.
 * Iterates through each line in the text file, keeping track of which section
 * it's currently in.
 */
async function casesToJSON(inputFilename, outputFilename) {
	let cases;
	try {
		cases = await readFile(inputFilename, "utf8");
	} catch(e) {
		console.error(`Could not find file ${inputFilename}`);
		return;
	}

	// Iterates through each line in the file sequentially.
	const output = cases.split('\n').reduce((accum, line) => {
		// Determines if we're currently in the "Zip code" section.
		if (line === 'Zip') {
			accum._currentSection = 'zip';
			accum._indeces = [];
			accum._curIndex = 0;
		}

		// Determines if we're currently in the "Reported Cases" section.
		// Note: we don't care about the estimated or total cases sections,
		// which are statistical guesses.
		if (line === 'Reported Cases' || line === 'Rep. Cases') {
			accum._currentSection = 'counts';
			accum._curIndex = 0;
		}

		// Checks if the current text line is likely a zip code.
		if (isZipCode(line) && accum._currentSection === 'zip') {
			accum._indeces[accum._curIndex] = line;
			accum._curIndex++;

			return accum;
		}

		/**
		 * Checks if the current line appears to be a confirmed case count.
		 * Note: this assumes that the confirmed case count list will always
		 * appear first.  Subsequent lists of numbers (e.g. estimated cases,
		 * possible cases) will be ignored.
		 */
		if (isCaseCount(line) && accum._currentSection === 'counts') {
			const zipCode = accum._indeces[accum._curIndex];

			if (typeof zipCode === 'undefined') {
				return accum;
			}

			accum[zipCode] = parseInt(line.replace(',', ''));
			accum._curIndex++;
			return accum;
		}

		return accum;
	}, {});

	// Removes any temporary props we used while iterating through each line.
	const cleanedOutput = removePrivateProps(output);

	await writeFile(outputFilename, JSON.stringify(cleanedOutput, null, 2));
}

if (!date) {
	throw new Error('Must supply date to process.');
} else {
	console.log(`Processing ${date}...`);

	casesToJSON(normalize(`${__dirname}/../data/${date}.txt`), normalize(`${__dirname}/../data/${date}.json`));
}


