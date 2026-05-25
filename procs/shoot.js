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
const fs = require('fs/promises');
const path = require('path');
const {PNG} = require('pngjs');

// FUNCTIONS

/*
  Coerces a label into a filesystem-safe string. Runs of any character outside
  [A-Za-z0-9._-] collapse to one underscore; leading and trailing dots and
  underscores are stripped (no hidden files, no traversal); capped at 100
  characters; falls back to 'unnamed' if nothing usable remains.
*/
const sanitizeLabel = (label) => {
  const raw = String(label);
  const cleaned = raw
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 100) || 'unnamed';
  if (cleaned !== raw) {
    console.log(`>> shoot: label sanitized from "${raw}" to "${cleaned}"`);
  }
  return cleaned;
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
exports.shoot = async (page, label, tmpDir, options = {}) => {
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
    const fileName = `testaro-shoot-${sanitizeLabel(label)}.png`;
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
