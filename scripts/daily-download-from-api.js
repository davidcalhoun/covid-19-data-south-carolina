import fetch from 'node-fetch';
import datefns from 'date-fns';
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import {
	readAllFiles,
	parseJSON,
	isJSON,
	lastValue,
	filterZero,
	ascending,
	fillSequentialArray,
	scale,
	resizeArray,
	average,
	slice,
} from "./utils.js";

const { format } = datefns;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

const zipMetaFilename = "scZipMeta.json";
const outputFilename = "casesMerged.json";
const scdhecCovidDataUrl = 'https://services2.arcgis.com/XZg2efAbaieYAXmu/arcgis/rest/services/COVID19__Zip_Code__TIME_Series_View/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=json';
const firstDayMS = 1583366400000;
const msInADay = 1000 * 60 * 60 * 24;

async function getData() {
  var response = await fetch(scdhecCovidDataUrl);
  var data = await response.json();
  return data;
}

function dateAscending({date: dateA}, {date: dateB}) {
	return dateA - dateB;
}

function getLastWeekAverage(cases, index) {
	const lastWeekCases = slice(cases, index - 7, 7);

	return average(lastWeekCases);
}

function areSameDay(dateA, dateB) {
	return format(new Date(dateA), 'yyyy-MM-dd') === format(new Date(dateB), 'yyyy-MM-dd');
}

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

async function init() {
	const data = await getData();

	const zipMeta = await readFile(
		normalize(`${__dirname}/../data/${zipMetaFilename}`),
		"utf8"
	);
	const zipMetaJSON = parseJSON(zipMeta);

	const cases = data.features.map(({attributes}) => {
		const { Zip: zip, Total_Cases: total, Date: date } = attributes;

		return {
			zip,
			total,
			date,
			dateFormatted: format(new Date(date), 'yyyy-MM-dd')
		}
	});

	const casesSorted = cases.sort(dateAscending);

	const output = Object.values(zipMetaJSON).reduce((accum, zipObj) => {
		// Assembles info for this zip code.

		const { zip: rawZip } = zipObj;
		const zip = parseInt(rawZip);

		// All confirmed cases, for all dates.
		const casesForZip = casesSorted.filter(({zip: zipToFind}) => zip === zipToFind);

		let curDateMS = firstDayMS;
		let cases = [];
		while (curDateMS <= Date.now()) {
			const hasCasesForDate = casesForZip.find(({date}) => areSameDay(date, curDateMS));

			if (hasCasesForDate) {
				cases.push(hasCasesForDate.total);
			} else {
				cases.push(0);
			}

			curDateMS += msInADay;
		}

		// const cases = casesForZip.reduce((allCasesForZip, casesForDate) => {
		// 	allCasesForZip.push(casesForDate.total);
		// 	return allCasesForZip;
		// }, []);

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
		/* Quantiles used in the map visualization legend. */
		quantiles: getQuantiles(output),

		dateBounds: {
			first: format(new Date(firstDayMS), 'yyyy-MM-dd'),
			last: format(new Date(casesSorted[casesSorted.length - 1].date), 'yyyy-MM-dd'),
		}
	};

	await writeFile(
		`${__dirname}/../data/${outputFilename}`,
		JSON.stringify(output)
	);

	process.exit(1);
}

init();
