/**
 * Merges all JSON files under `/data` into `casesMerged.json`, and
 * computes quantiles for data display.
 */

import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import { deepAssign } from "deep-object-assign-with-reduce";
import d3Array from "d3-array";
import d3Scale from "d3-scale";

const { range, descending } = d3Array;
const { scaleQuantile } = d3Scale;

import { readAllFiles, parseJSON, isJSON, lastValue } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

const outputFilename = "casesMerged.json";
const zipMetaFilename = "scZipMeta.json";

/**
 * Removes values that are 0.  For Array filter.
 */
const filterZero = (val) => val > 0;

/**
 * Sorts values in ascending order.  For Array sort.
 */
const ascending = (a, b) => a - b;

function getDomains(zipCodes) {
	let all = Object.values(zipCodes)
		.reduce((accum, { cases, population }) => {
			return [...accum, ...cases];
		}, [])
		.filter(filterZero);

	let perCapita = Object.values(zipCodes)
		.reduce((accum, { zip, cases, population }) => {
			/**
			 * Note: Some zip codes such as 29912, with a small population,
			 * can really skew the data, so we need to drop these for the per
			 * capita quantile legend.
			 */
			if (population < 100) {
				return accum;
			}

			const perCapita = cases.map(
				(c) => (c / parseInt(population)) * 10000
			);

			return [...accum, ...perCapita];
		}, [])
		.filter(filterZero);

	let averageChange = Object.values(zipCodes)
		.reduce((accum, { zip, averageChange }) => {
			return [...accum, ...averageChange];
		}, [])
		.filter(filterZero);

	return {
		all: Float64Array.from(all).sort(ascending),
		perCapita: Float64Array.from(perCapita).sort(ascending),
		averageChange: Float64Array.from(averageChange).sort(ascending),
	};
}

/**
 * Creates a new array of sequential values of length len, starting from 1.
 */
export const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

const scale = (input, inputMax, outputMax) => {
  return (input * outputMax) / inputMax;
}

/**
 * Minifies a sorted array.
 * Examples:
 * resizeArray([2,4,6,8,10], 2);
 * -> [4,8]
 * resizeArray([1,2,3,4,5,6,7], 1);
 * -> [5]
 * resizeArray([1,2,3,4,5,6,7], 3);
 * -> [2,4,6]
 */
var resizeArray = (arr, outputSize) => {
  const probePoints = fillSequentialArray(outputSize);
  
  return probePoints.map(val => {
    const out = scale(val, outputSize + 1, arr.length);
    const inLeftSide = (out / arr.length) <= 0.5;

    if (Number.isInteger(out)) {
      return inLeftSide ? arr[out - 1] : arr[out];
    }
    
    return arr[Math.floor(out)];
  });
}

/**
 * Determines the average in an array of numbers.
 */
const average = (numArr) => {
	if (numArr.length === 0) return 0;

	const sum = numArr.reduce((total, val) => {
		if (Number.isFinite(val)) {
			return total + parseFloat(val);
		} else {
			return total;
		}
	}, 0.0);

	return sum / numArr.length;
};

/**
 * Computes data quantiles for use in the map visualization legend.  Precomputing
 * it here results in a clientside performance boost on initial load.
 */
function getQuantiles(zipCodes) {
	let domains = getDomains(zipCodes, false);

	/**
	 * Quantiles for different data displays.
	 * all = "All cases"
	 * perCapita = "Per Capita"
	 * averageChange = "Daily Change %"
	 */
	return {
		all: resizeArray(domains.all, 100),
		perCapita: resizeArray(domains.perCapita, 100),
		averageChange: resizeArray(domains.averageChange, 100),

		/* Append highest values, which are not included in quantiles/percentiles. */
		maxAll: lastValue(domains.all),
		maxPerCapita: lastValue(domains.perCapita),
		maxAverageChange: lastValue(domains.averageChange),
	};
}

function slice(arr = [], startIndex = 0, len) {
	const start = startIndex >= 0 ? startIndex : 0;

	const end = start + len;

	return arr.slice(start, end);
}

function getLastWeekAverage(cases, index) {
	const lastWeekCases = slice(cases, index - 7, 7);

	return average(lastWeekCases);
}

async function merge() {
	const zipMeta = await readFile(
		normalize(`${__dirname}/../data/${zipMetaFilename}`),
		"utf8"
	);
	const zipMetaJSON = parseJSON(zipMeta);

	const files = await readAllFiles(`${__dirname}/../data`, isJSON);

	// Parses all files as JSON.
	const filesJSON = files.reduce((processedFiles, { filename, contents }) => {
		if (filename === outputFilename || filename === "scZipMeta.json") {
			return processedFiles;
		}

		const json = parseJSON(contents);

		return [
			...processedFiles,
			{
				...json,
				meta: {
					...json.meta,
					date: basename(filename, ".json"),
				},
			},
		];
	}, []);

	const output = Object.values(zipMetaJSON).reduce((accum, zipObj) => {
		// Assembles info for this zip code.

		const { zip } = zipObj;

		// All confirmed cases, for all dates.
		const cases = filesJSON.reduce((cases, fileObj) => {
			const casesForDate = fileObj[zip] || null;
			cases.push(parseInt(casesForDate));
			return cases;
		}, []);

		// Computes Daily Change % based on weekly average.
		const averageChange = cases.map((caseCount, index, arr) => {
			if (index === 0 || !Number.isFinite(caseCount)) return 1;

			const lastWeekAverage = getLastWeekAverage(arr, index);

			if (caseCount === lastWeekAverage) return 1;

			const avgChange =
				lastWeekAverage < 2
					? caseCount / 1
					: caseCount / lastWeekAverage;

			return avgChange;
		});

		accum[zip] = {
			...zipObj,
			cases,
			averageChange,
		};

		return accum;
	}, {});

	// General metadata.
	output.meta = {
		/* All case dates.  Need to list individual dates, since there are early date gaps in reporting. */
		dates: filesJSON.map(({ meta }) => {
			return meta.date;
		}),
		/* Quantiles used in the map visualization legend. */
		quantiles: getQuantiles(output),
	};

	await writeFile(
		`${__dirname}/../data/${outputFilename}`,
		JSON.stringify(output)
	);
}

merge();
