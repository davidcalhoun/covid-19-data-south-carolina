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


/**
 * Removes values that are 0.  For Array filter.
 */
export const filterZero = (val) => val > 0;

/**
 * Sorts values in ascending order.  For Array sort.
 */
export const ascending = (a, b) => a - b;

/**
 * Creates a new array of sequential values of length len, starting from 1.
 */
export const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

export const scale = (input, inputMax, outputMax) => {
  return (input * outputMax) / inputMax;
}

/**
 * Minifies a sorted array.
 * Examples:
 * resizeArray([2,4,6,8,10], 2);
 * -> [4,8]
 * resizeArray([1,2,3,4,5,6,7], 1);
 * -> [4]
 * resizeArray([1,2,3,4,5,6,7], 3);
 * -> [2,4,6]
 */
export const resizeArray = (arr, outputSize) => {
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
export const average = (numArr) => {
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

export const slice = (arr = [], startIndex = 0, len) => {
	const start = startIndex >= 0 ? startIndex : 0;

	const end = start + len;

	return arr.slice(start, end);
}