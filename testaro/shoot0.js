/*
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot0
  This test makes and saves the first of two screenshots.
*/

// IMPORTS

const {shoot} = require('../procs/shoot');

// FUNCTIONS

// Makes and saves the first screenshot.
exports.reporter = async (page, _0, _1, _2, tmpDir, fileNameSuffix = '0') => {
  // Make and save the screenshot.
  const pngPath = await shoot(page, {
    exclusionSelector: null,
    colorType: 0,
    action: {
      dirPath: tmpDir,
      fileNameSuffix
    }
  });
  // Return whether the screenshot was prevented.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
