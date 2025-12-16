/*
  © 2025 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot1
  This test makes and saves the second of two screenshots.
*/

// IMPORTS

const {shoot} = require('../procs/shoot');

// FUNCTIONS

exports.reporter = async page => {
  // Make and save the second screenshot.
  const pngPath = await shoot(page, 1);
  // Return the file path or a failure result.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
