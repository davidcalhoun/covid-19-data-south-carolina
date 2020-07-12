# covid-19-data-south-carolina

Daily COVID-19 data breakdown by zip code for the state of South Carolina.  Generated from [PDF exports from DHEC](https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19/sc-cases-county-zip-code-covid-19).  The PDF exports are not ideal, but as far as I know DHEC offers no other easily-consumable form of data.

Currently this process is semi-automated:

1. PDF exported from DHEC website.
1. PDF converted to text via [pdftotext.com](pdftotext.com)
1. Text cleaned up manually, then the `daily-update.sh` script is run (e.g. `npm run daily-update 2020-07-11`)

This process isn't ideal, but it's functional.  I was kind of hoping the pandemic would have settled down by now, so I didn't invest much in automation.

## Installation
This runs with [Node.js](https://nodejs.org) and dependencies are managed by [NPM](https://www.npmjs.com/), which comes with Node.

1. Clone this repo and move into the newly-created directory: `git clone git@github.com:davidcalhoun/covid-19-data-south-carolina.git && cd covid-19-data-south-carolina`
1. Install dependencies by running `npm i`.  This will create a `node_modules` directory, containing all package dependencies.
1. Take a look at the scripts section of `package.json`, which are available scripts you can run.  For instance, to version bump dependencies automatically, you can run `npm run bump`.

## `data`
All data exports live here.  The original `PDF` is preserved alongside its `TXT` and `JSON` translations.

* `data/countyFormat` - old exports in "County Format" (prior to April 10).
* `data/casesMerged.json` - data for all days merged, including quantile distributions for the [map visualization](https://davidcalhoun.github.io/covid-19-map-south-carolina/).  This quantile computation used to be performed clientside, but started to become sluggish as the dataset increased (especially noticeable on mobile devices).
* `data/scZipMeta.json` - zip code metadata via [simplemaps.com](https://simplemaps.com/data/us-zips).  Necessary for per capita calculations.

## `scripts`
There are several helper scripts to retrieve and process data.  Some scripts are used daily, while others are more experimental or legacy.

1. `convertToZipFormat.js` - (legacy) translates data sorted by County into Zip code format.  Needed for data PDFs prior to April 10
1. `daily-download.js` - Automation to download PDFs from the Tableau dashboard.
1. `daily-update.sh` - updates and pushes the `casesMerged.json` file to Github, which automatically redeploys the [map visualization](https://davidcalhoun.github.io/covid-19-map-south-carolina/)
1. `merge.js` - merges all JSON data files and outputs `data/casesMerged.json`
1. `pdfToJSON.js` - (experimental WIP) - initial attempts to run OCR on PDFs, to avoid needing to use [pdftotext.com](pdftotext.com)
1. `stats.js` - helper script to determine which zip codes are newly affected.  Not used much now, as most all zip codes are affected.
1. `txtToJSON.js` - converts TXT data to JSON format.
1. `utils.js` - shared utilities (for file reading, data manipulation, etc)

## TODO
* Minor: JSON should have unquoted numbers (`{12345: 67}` instead of `{"12345": "67"}`)
* Remove need to clean up TXT OCR manually.
