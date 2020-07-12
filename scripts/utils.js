/**
 * Shared helper utilities.
 */

import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import { deepAssign } from "deep-object-assign-with-reduce";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

/**
 * Reads all files in a directory, ignoring files that don't pass
 * through the required filterFn.
 */
export async function readAllFiles(dir, filterFn) {
	const files = await readdir(normalize(dir));

	let promises = [];
	for (const filename of files) {
		if (filterFn(filename)) {
			promises.push(
				new Promise(async (resolve, reject) => {
					let contents;

					try {
						contents = await readFile(
							normalize(`${dir}/${filename}`),
							"utf8"
						);
					} catch (e) {
						reject(e);
					}

					resolve({
						filename,
						contents,
					});
				})
			);
		}
	}

	return await Promise.all(promises);
}

/**
 * Parses text input to JSON.
 */
export function parseJSON(text) {
	let json = null;

	try {
		json = JSON.parse(text);
	} catch (e) {
		throw new Error("Error parsing JSON.");
	}

	return json;
}

/* Determines if a file is of type JSON. */
export const isJSON = (str) => !!str.match(".json$");

/* Returns the last value in an array. */
export const lastValue = (arr) => arr[arr.length - 1];
