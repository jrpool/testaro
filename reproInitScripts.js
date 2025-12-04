/*
  reproInitScripts.js
  Minimal example to demonstrate an apparent Playwright bug reported as issue 38442
  (https://github.com/microsoft/playwright/issues/38442).
*/

// save as e.g. reproInitScripts.js
// run with: node reproInitScripts.js

const {chromium} = require('playwright');

(async () => {

  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext();

  context.on('page', async page => {
    console.log('context.on("page") fired');

    // First init script
    await page.addInitScript(() => {
      window.helperOne = () => 'one';
    });

    // Second init script
    await page.addInitScript(() => {
      window.helperTwo = () => 'two';
    });

    // Third init script
    await page.addInitScript(() => {
      window.helperThree = () => 'three';
    });

  });

  const page = await context.newPage();

  await page.goto('https://example.com', {waitUntil: 'domcontentloaded'});

  const result = await page.evaluate(() => ({
    helperOne: typeof window.helperOne,
    helperTwo: typeof window.helperTwo,
    helperThree: typeof window.helperThree
  }));

  console.log('Helper types:', result);

  await browser.close();

})();
