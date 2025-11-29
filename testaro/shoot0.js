/*
  © 2025 Jonathan Robert Pool. All rights reserved.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot0
  This test makes and saves the first of two screenshots.
*/

// IMPORTS

const {shoot} = require('../procs/shoot');

// FUNCTIONS

exports.reporter = async page => {
  // Make and save the first screenshot.
  const pngPath = await shoot(page, 0);
  // Return the file path or a failure result.
  return {
    data: {
      prevented: ! pngPath
    }
  };
};
