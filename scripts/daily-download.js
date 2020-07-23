/**
 * (legacy) Downloads zip code PDFs from the SC DHEC dashboard using an actual browser.
 */

import puppeteer from'puppeteer';
import datefns from 'date-fns'
const { format } = datefns;

const dhecDashboardURL = 'https://public.tableau.com/views/ZipCodeCOVID/Option1?%3Aembed=y&%3AshowVizHome=no&%3Adisplay_count=y&%3Adisplay_static_image=y&%3AbootstrapWhenNotified=true&%3Alanguage=en&:embed=y&:showVizHome=n&:apiID=host0#navType=0&navSrc=Parse';

/**
 * Pauses execution via a Promise.
 * When used with async/await, any code that follows the await will
 * be placed onto the event loop queue and executed later,
 * without blocking execution of other code in the event loop.
 *
 * Somewhat last resort, but is sometimes unfortunately the easiest
 * way to get things working.
 */
const pause = (msWait = 1000) => {
	return new Promise((res, rej) => {
		setTimeout(res, msWait);
	})
}

(async () => {
  const date = format(new Date(), 'yyyy-MM-dd');

  const browser = await puppeteer.launch({
  	headless: false,  // Downloads don't seem to function in headless mode.
  });

  // Starts the Chromium browser and opens the SC DHEC COVID dashboard.
  const page = await browser.newPage();
  await page.goto(dhecDashboardURL);

  /**
   * Helper that waits for an interactive element to be present on the page before
   * attempting to interact with it.
   */
  const waitForAndClickSelector = async (selector) => {
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  // Hack: waits for page to be ready (TODO: still needed?).
  await pause(1000);
  
  // Clicks on Download icon, which opens the "Download" modal.
  await waitForAndClickSelector('[data-tb-test-id="download-ToolbarButton"]');

  // Clicks on PDF button in the modal, which opens the "Download PDF" modal.
  await waitForAndClickSelector('[data-tb-test-id="DownloadPdf-Button"]');

  // Hack: waits for the server to generate the PDF.
  await pause(2000);

  // Include dropdown.  Selects "Specific sheets from this dashboard" via keyboard interaction.
  await page.focus('[data-tb-test-id="PdfDialogIncludeDropdown"]');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await waitForAndClickSelector('[data-tb-test-id="PdfDialogSheetPickerSelectAll-Button"]');  // Click "Select All".

  // Clicks the "Download" button in the "Download PDF" modal.
  await waitForAndClickSelector('[data-tb-test-id="PdfDialogCreatePdf-Button"]')

  // Hack: waits for the PDF to download.
  await pause(10000);

  // TODO: sometimes this doesn't actually close the browser for some reason.
  await browser.close();

  process.exit(1);
})();
