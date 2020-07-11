import puppeteer from'puppeteer';
import datefns from 'date-fns'
const { format } = datefns;

const pause = (msWait = 1000) => {
	return new Promise((res, rej) => {
		setTimeout(res, msWait);
	})
}

(async () => {
  const date = format(new Date(), 'yyyy-MM-dd');

  const browser = await puppeteer.launch({
  	headless: false,
  });
  const page = await browser.newPage();
  await page.goto('https://public.tableau.com/views/ZipCodeCOVID/Option1?%3Aembed=y&%3AshowVizHome=no&%3Adisplay_count=y&%3Adisplay_static_image=y&%3AbootstrapWhenNotified=true&%3Alanguage=en&:embed=y&:showVizHome=n&:apiID=host0#navType=0&navSrc=Parse');

  const waitForAndClickSelector = async (selector) => {
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  await pause(1000);
  
  await waitForAndClickSelector('[data-tb-test-id="download-ToolbarButton"]');  // click on Download icon
  await waitForAndClickSelector('[data-tb-test-id="DownloadPdf-Button"]');      // click on PDF button

  await pause(2000);  // Wait for server to generate.
  await page.focus('[data-tb-test-id="PdfDialogIncludeDropdown"]');
  //await pause(2000);
  await page.keyboard.press('Enter');
  //await waitForAndClickSelector('[data-tb-test-id="PdfDialogIncludeDropdown"]');  // click on Include drodown
  //await pause(2000);

  //await page.focus('[data-tb-test-id="Overlay-Root"]');
  
  //await pause(2000);
  //await page.keyboard.press('Enter');
  //await pause(2000);

  //await page.focus('[data-itemvalue="thisView"]');
  //await pause(2000);

  //await page.keyboard.press('Enter');
  //document.dispatchEvent(new KeyboardEvent('keypress',  {'key':'Enter'}));
  //await waitForAndClickSelector('[data-itemvalue="thisDashboard"]');
  
  //await pause(2000);
  //document.dispatchEvent(new KeyboardEvent('keypress',  {'key':'ArrowDown'}));
  //await page.focus('[data-itemvalue="thisDashboard"]');
  await page.keyboard.press('ArrowDown');
  //await pause(2000);
  await page.keyboard.press('Enter');
  await waitForAndClickSelector('[data-tb-test-id="PdfDialogSheetPickerSelectAll-Button"]');
  //await pause(2000);
  await waitForAndClickSelector('[data-tb-test-id="PdfDialogCreatePdf-Button"]')

  //await page.screenshot({path: `data/automated/${date}.png`});
  await pause(10000);

  await browser.close();
  process.exit(1);
})();