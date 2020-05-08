import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import { deepAssign } from "deep-object-assign-with-reduce";

import { readAllFiles, parseJSON, isJSON } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

const outputDir = `${__dirname}/../data/countyFormat/zipFormat`;

async function convertToZipCodeFormat() {
	const files = await readAllFiles(`${__dirname}/../data/countyFormat`, isJSON);

	const filesJSON = files.reduce((processedFiles, { filename, contents }) => {
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

	const output = filesJSON.reduce(async (accum, fileObj) => {
		const zipFormat = Object.entries(fileObj).reduce((zips, [countyName, zipsInCounty]) => {
			if (countyName === 'meta') {
				return zips;
			}

			zipsInCounty.forEach(({ zip, positive }) => {
				const casesInt = parseInt(positive);

				zips[zip] = zips[zip]
					? casesInt + zips[zip]
					: casesInt;
			}, {});

			return zips;
		}, accum);

		console.log(333, fileObj)

		try {
			await writeFile(
				`${outputDir}/${fileObj.meta.date}.json`,
				JSON.stringify(zipFormat, null, 2)
			);
		} catch(e) {
			console.error(e);
		}
	}, {});

}

convertToZipCodeFormat();
