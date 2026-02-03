/*
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot1
  This test makes and saves the second of two screenshots. It aborts if the first screenshot was prevented.
*/

// IMPORTS

const fs = require('fs/promises');
const os = require('os');
const {shoot} = require('../procs/shoot');

// CONSTANTS

const tmpDir = os.tmpdir();

// FUNCTIONS

exports.reporter = async page => {
  const tempFileNames = await fs.readdir(tmpDir);
  let pngPath = '';
  // If there is a shoot0 file:
  if (tempFileNames.includes('testaro-shoot-0.png')) {
    // Make and save the second screenshot.
    pngPath = await shoot(page, 1);
  }
  // Return whether the screenshot was prevented.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
