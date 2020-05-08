import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, normalize, basename } from "path";
import { deepAssign } from "deep-object-assign-with-reduce";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { readFile, writeFile, readdir } = fs;

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


export function parseJSON(text) {
	let json = null;

	try {
		json = JSON.parse(text);
	} catch (e) {
		throw new Error("Error parsing JSON.");
	}

	return json;
}

export const isJSON = (str) => !!str.match(".json$");