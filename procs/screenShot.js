/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  screenShot
  This procedure creates and returns a full-page screenshot, optionally with an exclused element.
  This procedure uses the Playwright page.screenshot method, which is not implemented for the
  firefox browser type.
*/

// IMPORTS

// Shared configuration for timeout multiplier.
const {applyMultiplier} = require('./config');

// FUNCTIONS

// Creates and returns a screenshot.
exports.screenShot = async (page, exclusion = null) => {
  const options = {
    fullPage: true,
    omitBackground: true,
    timeout: applyMultiplier(4000)
  };
  if (exclusion) {
    options.mask = [exclusion];
  }
  // Make and return a screenshot as a buffer.
  return await page.screenshot(options)
  .catch(error => {
    console.log(`ERROR: Screenshot failed (${error.message})`);
    return '';
  });
};
