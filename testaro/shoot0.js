/*
  © 2025 Jonathan Robert Pool.
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
exports.reporter = async page => {
  // Make and save the screenshot.
  const pngPath = await shoot(page, 0);
  // Return whether the screenshot was prevented.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
