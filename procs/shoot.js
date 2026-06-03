/*
  © 2026 Jeff Witt.
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot
  Makes and saves as a PNG buffer file a full-page screenshot and returns the file path.

  Call shape:
    shoot(page, label, options?)
      label:   string|number used in the saved filename. Sanitized to
               testaro-shoot-<safe>.png — characters outside [A-Za-z0-9._-]
               collapse to '_', leading/trailing dots and underscores are
               stripped, length is capped at 100, and an empty result becomes
               'unnamed'.
      options: optional object:
        exclusion: a Playwright Locator to mask in the screenshot.
        dir:       output directory (defaults to the OS temp dir).
*/

// IMPORTS

// Shared configuration for timeout multiplier.
const {applyMultiplier} = require('./config');
const {nowStamp} = require('./dateTime');
const fs = require('fs/promises');
const path = require('path');
const {PNG} = require('pngjs');

// FUNCTIONS

// Returns a filename-includable string.
const fileNameSubstring = string => {
  // If a string was provided:
  if (typeof string === 'string' && string.length) {
    const cleanSubstring = string
    // Replace unsafe character substrings with single underscores.
    .replace(/[^\w.-]+/g, '_')
    // Remove leading and trailing non-alphanumeric characters.
    .replace(/^[._-]+|[._-]+$/g, '')
    // Remove any characters after the first 100.
    .slice(0, 100);
    // Return the resulting string, which may be empty.
    return cleanSubstring;
  }
  // Otherwise, i.e. if no string was provided, return an empty string.
  return '';
};
// Returns a probably unique string.
const probablyUniqueString = (randomLength = 3) => {
  const string = `${nowStamp()}-${Math.random().toString(36).slice(2, 2 + randomLength)}`;
  return string;
};

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
// Creates a screenshot and returns it or the path to a file containing it.
exports.shoot = async (page, {
  exclusion = null,
  colorType = 0,
  // Return the PNG or {dirPath, fileNameSuffix} to save it in a file.
  action = 'return'
} = {}) => {
  // Make and get a screenshot as a buffer.
  let shot = await screenShot(page, exclusion);
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
    // If the PNG is to be saved in a file:
    if (typeof action === 'object') {
      let {dirPath = tmpDir, fileNameSuffix} = action;
      // If no file name suffix was provided, use a probably unique string.
      fileNameSuffix = fileNameSuffix ? fileNameSubstring(fileNameSuffix) : probablyUniqueString(4);
      const fileName = `screenshot-${fileNameSuffix}.png`;
      // Get the path for the file.
      const pngPath = path.join(dirPath, fileName);
      // Save the PNG buffer there.
      await fs.writeFile(pngPath, pngBuffer);
      // Return the path to the file.
      return pngPath;
    }
    // Otherwise, i.e. if the PNG is not to be saved in a file, return it.
    return pngBuffer;
  }
  // Otherwise, i.e. if it failed:
  else {
    // Return this.
    return '';
  }
};
