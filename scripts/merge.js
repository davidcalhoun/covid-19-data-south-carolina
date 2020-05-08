import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import { deepAssign } from "deep-object-assign-with-reduce";

import { readAllFiles, parseJSON, isJSON } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

const outputFilename = "casesMerged.json";

const zipMetaFilename = "scZipMeta.json";

async function merge() {
	const zipMeta = await readFile(
		normalize(`${__dirname}/../data/${zipMetaFilename}`),
		"utf8"
	);
	const zipMetaJSON = parseJSON(zipMeta);

	const files = await readAllFiles(`${__dirname}/../data`, isJSON);

	const filesJSON = files.reduce((processedFiles, { filename, contents }) => {
		if (filename === outputFilename || filename === 'scZipMeta.json') {
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
			cases: allCasesForZip
		};

		if (!accum.meta) {
			// init metadata
			const dates = filesJSON.map(({ meta }) => {
				return meta.date;
			});

			accum.meta = {
				dates
			}
		}

		return accum;
	}, {});

	console.log(222, Object.values(output).length)

	await writeFile(
		`${__dirname}/../data/${outputFilename}`,
		JSON.stringify(output)
	);
}

merge();
