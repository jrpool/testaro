/*
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot
  Makes and saves as a PNG buffer file a full-page screenshot and returns the file path.

  Call shape:
    shoot(page, label, options?)
      label:   string|number used in the saved filename (testaro-shoot-<label>.png).
      options: optional object:
        exclusion: a Playwright Locator to mask in the screenshot.
        dir:       output directory (defaults to the OS temp dir).
*/

// IMPORTS

// Shared configuration for timeout multiplier.
const {applyMultiplier} = require('./config');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {PNG} = require('pngjs');

// CONSTANTS

const tmpDir = os.tmpdir();

// FUNCTIONS

// Creates and returns a screenshot.
const screenShot = async (page, exclusion = null) => {
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
exports.shoot = async (page, label, options = {}) => {
  const exclusion = options.exclusion || null;
  const dir = options.dir || tmpDir;
  // Make and get a screenshot as a buffer.
  let shot = await screenShot(page, exclusion);
  // If it succeeded:
  if (shot.length) {
    // Get the screenshot as an object representation of a PNG image.
    let png = PNG.sync.read(shot);
    shot = null;
    const pngBuffer = PNG.sync.write(png);
    png = null;
    // Force garbage collection if available and if --expose-gc was a node option.
    if (global.gc) {
      global.gc();
    }
    const fileName = `testaro-shoot-${label}.png`;
    const pngPath = path.join(dir, fileName);
    // Save the PNG buffer.
    await fs.writeFile(pngPath, pngBuffer);
    // Return the result.
    return pngPath;
  }
  // Otherwise, i.e. if it failed:
  else {
    // Return this.
    return '';
  }
};
