/*
  © 2026 Jeff Witt.
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot
  Manages the production and disposition of screenshots of a page.
*/

// IMPORTS

// Shared configuration for timeout multiplier.
const {applyMultiplier} = require('./config');
const {nowStamp} = require('./dateTime');
const fs = require('fs/promises');
const path = require('path');
const {PNG} = require('pngjs');

// FUNCTIONS

// Returns a probably unique file name.
const randomFileName = (suffixLength = 3) => {
  const fileName = `${nowStamp()}-${Math.random().toString(36).slice(2, 2 + suffixLength)}`;
  return fileName;
};
// Creates and returns a screenshot.
const screenShot = async (page, exclusionLocator = null) => {
  const options = {
    fullPage: true,
    scale: 'css',
    timeout: applyMultiplier(4000)
  };
  if (exclusionLocator) {
    options.mask = [exclusionLocator];
  }
  // Make and return a screenshot as a buffer.
  return await page.screenshot(options)
  .catch(error => {
    console.log(`ERROR: Screenshot failed (${error.message})`);
    return '';
  });
};
// Creates and disposes of the PNG of a screenshot.
exports.shoot = async (page, report, {
  // Playwright locator of a mask.
  exclusionSelector = null,
  // Color fidelity: 0 (grayscale), 2 (RGB), 4 (grayscale alpha), 6 (RGBA).
  colorType = 0,
  // Disposition: return, report, file.
  action = 'return'
} = {}) => {
  // Make and get a screenshot as a buffer.
  let shot = await screenShot(page, exclusionSelector ? page.locator(exclusionSelector) : null);
  // If it succeeded:
  if (shot.length) {
    // Get the screenshot as an object representation of a PNG image.
    let png = PNG.sync.read(shot);
    shot = null;
    // Convert the PNG object to a buffer, applying the specified color type.
    const pngBuffer = PNG.sync.write(png, {colorType});
    png = null;
    // Force garbage collection if available and if --expose-gc was a node option.
    if (global.gc) {
      global.gc();
    }
    // Convert the buffer to a base64 string.
    const base64 = pngBuffer.toString('base64');
    // If the string is to be returned:
    if (action === 'return') {
      // Return it.
      return base64;
    }
    // Otherwise, if it is to be appended to the report:
    if (action === 'report') {
      report.images ??= [];
      // Append it to the images array in the report.
      report.images.push(base64);
      // Return the index of the added image in the array.
      return report.images.length - 1;
    }
    // Otherwise, if it is to be saved in a file:
    if (action === 'file') {
      const fileName = randomFileName(4);
      const filePath = path.join(report.jobData.tmpDir, fileName);
      // Save it in a file.
      await fs.writeFile(filePath, base64);
      // Return the file name.
      return fileName;
    }
    // Otherwise, i.e. if the action is invalid, return this.
    return '';
  }
  // Otherwise, i.e. if it failed:
  else {
    // Return this.
    return '';
  }
};
