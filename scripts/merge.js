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

const filterZero = (val) => val > 0;

const ascending = (a, b) => a - b;

function getDomains(zipCodes, isPerCapita) {
	let all = Object.values(zipCodes)
		.reduce((accum, { cases, population }) => {
			return [...accum, ...cases];
		}, [])
		.filter(filterZero);

	let perCapita = Object.values(zipCodes)
		.reduce((accum, { zip, cases, population }) => {
			// Some zip codes such as 29912, with a small population, can really skew the data,
			// so we need to drop these for the per capita quantile legend.
			if (population < 100) {
				return accum;
			}

			const perCapita = cases.map(
				(c) => (c / parseInt(population)) * 10000
			);

			return [...accum, ...perCapita];
		}, [])
		.filter(filterZero);

	return {
		all: Float64Array.from(all).sort(ascending),
		perCapita: Float64Array.from(perCapita).sort(ascending),
	};
}

export const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

const resizeArray = (arr, outputSize) => {
	const step = Math.floor(arr.length / outputSize);
	const output = fillSequentialArray(outputSize);

	return output.map(val => {
		return arr[val * step];
	});
}

function getQuantiles(zipCodes) {
	let domains = getDomains(zipCodes, false);

	return {
		all: resizeArray(domains.all, 100),
		perCapita: resizeArray(domains.perCapita, 100),
		maxAll: lastValue(domains.all),
		maxPerCapita: lastValue(domains.perCapita)
	}
}

async function merge() {
	const zipMeta = await readFile(
		normalize(`${__dirname}/../data/${zipMetaFilename}`),
		"utf8"
	);
	const zipMetaJSON = parseJSON(zipMeta);

	const files = await readAllFiles(`${__dirname}/../data`, isJSON);

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

	// 	const output = filesJSON.reduce((accum, fileObj) => {
	// 		return Object.entries(fileObj).reduce((zips, [zip, cases]) => {
	// 			const casesInt = parseInt(cases);
	//
	// 			if (zip === "meta") {
	// 				zips.meta =
	// 					zips.meta && zips.meta.date
	// 						? {
	// 								...zips.meta,
	// 								date: [...zips.meta.date, cases.date],
	// 						  }
	// 						: { date: [cases.date] }; // init
	//
	// 				return zips;
	// 			}
	//
	// 			zips[zip] = zips[zip]
	// 				? { ...zips[zip], cases: [...zips[zip].cases, casesInt] }
	// 				: {
	// 						cases: [casesInt],
	// 						population: zipMetaJSON[zip] ? parseInt(zipMetaJSON[zip].population) : 0,
	// 						countyNames: zipMetaJSON[zip]?.countyNames,
	// 				  }; // init zip code
	//
	// 			return zips;
	// 		}, accum);
	// 	}, {});

	const output = Object.values(zipMetaJSON).reduce((accum, zipObj) => {
		const { zip } = zipObj;

		const allCasesForZip = filesJSON.reduce((cases, fileObj) => {
			const casesForDate = fileObj[zip] || null;
			cases.push(parseInt(casesForDate));
			return cases;
		}, []);

		accum[zip] = {
			...zipObj,
			cases: allCasesForZip,
		};

		return accum;
	}, {});

	// Metadata
	output.meta = {
		dates: filesJSON.map(({ meta }) => {
			return meta.date;
		}),
		quantiles: getQuantiles(output),
	};

	await writeFile(
		`${__dirname}/../data/${outputFilename}`,
		JSON.stringify(output)
	);
}

merge();
