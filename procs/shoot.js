/*
  © 2025 Jonathan Robert Pool. All rights reserved.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot
  Makes and saves as a PNG buffer file a full-page screenshot and returns the file path.
*/

// IMPORTS

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {PNG} = require('pngjs');
const {screenShot} = require('./screenShot');

// CONSTANTS

const tmpDir = os.tmpdir();

// FUNCTIONS

exports.shoot = async page => {
  // Make and get a screenshot as a buffer.
  let shot = await screenShot(page);
  // If it succeeded:
  if (shot.length) {
    // Get the screenshot as an object representation of a PNG image.
    const png = PNG.sync.read(shot);
    const pngBuffer = PNG.sync.write(png);
    // Free the buffer memory.
    shot = null;
    // Force garbage collection if available and if --expose-gc was a node option.
    if (global.gc) {
      global.gc();
    }
    const fileName = `testaro-shoot-${Date.now()}.png`;
    const pngPath = path.join(tmpDir, fileName);
    // Save the PNG buffer.
    await fs.writeFile(pngPath, pngBuffer);
    // Return the result.
    return pngPath;
  }
  // Otherwise, i.e. if it failed:
  else {
    // Return this.
    return false;
  }
};
