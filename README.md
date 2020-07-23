# covid-19-data-south-carolina

Daily COVID-19 data breakdown by zip code for the state of South Carolina.

Prior to July 22, I wasn't aware of the [Open Data API](https://scdhec-covid-19-open-data-sc-dhec.hub.arcgis.com/datasets/covid-19-zip-code-time-series-view/data), so I was generating data based on [PDF exports from SC DHEC](https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19/sc-cases-county-zip-code-covid-19).

## Installation
This runs with [Node.js](https://nodejs.org) and dependencies are managed by [NPM](https://www.npmjs.com/), which comes with Node.

1. Clone this repo and move into the newly-created directory: `git clone git@github.com:davidcalhoun/covid-19-data-south-carolina.git && cd covid-19-data-south-carolina`
1. Install dependencies by running `npm i`.  This will create a `node_modules` directory, containing all package dependencies.
1. Take a look at the scripts section of `package.json`, which are available scripts you can run.  For instance, to version bump dependencies automatically, you can run `npm run bump`.

## Usage

* To update `data/casesMerged.json` with the most current data, run `$ npm run download-from-api`.
* To update and redeploy the [map visualization](https://davidcalhoun.github.io/covid-19-map-south-carolina/), run `$ npm run daily-update`

## `data`
All data exports live here.  Prior to July 22, I was converting PDF exports into JSON from the SC DHEC updates - the original `PDF` is preserved here alongside its `TXT` and `JSON` translations.

* `data/countyFormat` - old exports in "County Format" (prior to April 10).
* `data/casesMerged.json` - data for all days merged, including quantile distributions for the [map visualization](https://davidcalhoun.github.io/covid-19-map-south-carolina/).  This quantile computation used to be performed clientside, but started to become sluggish as the dataset increased (especially noticeable on mobile devices).
* `data/scZipMeta.json` - zip code metadata via [simplemaps.com](https://simplemaps.com/data/us-zips).  Necessary for per capita calculations.

## `scripts`
There are several helper scripts to retrieve and process data.  Some scripts are used daily, while others are more experimental or legacy.

1. `daily-download-from-api.js` - Downloads from the [SC DHEC Open Data API](https://scdhec-covid-19-open-data-sc-dhec.hub.arcgis.com/datasets/covid-19-zip-code-time-series-view/data) and generates `casesMerged.json`.
1. `daily-update.sh` - updates and pushes the `casesMerged.json` file to Github, which automatically redeploys the [map visualization](https://davidcalhoun.github.io/covid-19-map-south-carolina/)
1. `utils.js` - shared utilities (for file reading, data manipulation, etc)

### Legacy `scripts` (no longer used)
1. `convertToZipFormat.js` - (legacy) Translates data sorted by County into Zip code format.  Needed for data PDFs prior to April 10
1. `daily-download.js` - (legacy) Automation to download PDFs from the Tableau dashboard.
1. `merge.js` - (legacy) Merges all JSON data files and outputs `data/casesMerged.json`
1. `pdfToJSON.js` - (legacy) (experimental WIP) - initial attempts to run OCR on PDFs, to avoid needing to use [pdftotext.com](pdftotext.com)
1. `stats.js` - (legacy) helper script to determine which zip codes are newly affected.  Not used much now, as most all zip codes are affected.
1. `txtToJSON.js` - (legacy) converts TXT data to JSON format.