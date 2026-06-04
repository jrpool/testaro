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
const {shoot} = require('../procs/shoot');

// FUNCTIONS

// Make and save the second screenshot.
exports.reporter = async (page, report) => {
  let pngPath = '';
  // If there is a shoot0 file:
  if (report.jobData.testaroShoot0) {
    // Make and save the screenshot.
    pngPath = await shoot(page, {
      exclusionSelector: null,
      colorType: 0,
      action: 'file'
    });
    // If this succeeded:
    if (pngPath) {
      // Add the file path to the report.
      report.jobData.testaroShoot1 = pngPath;
    }
  }
  // Return whether the screenshot was prevented.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
