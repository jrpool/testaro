/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  targetTiny
  Related to Tenon rule 152.
  This test reports visible buttons, inputs, and non-inline links with widths or heights smaller
  than 24 pixels.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Module to classify links.
const {isTooSmall} = require('../procs/target');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'a:visible, button:visible, input:visible');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get data on it if illicitly small.
    const sizeData = await isTooSmall(loc, 24);
    // If it is:
    if (sizeData) {
      // Add the locator to the array of violators.
      all.locs.push([loc, `${sizeData.width} wide by ${sizeData.height} high`]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Interactive element pixel size (__param__) is less than 24 by 24',
    'Interactive elements are smaller than 24 pixels wide and high'
  ];
  return await getRuleResult(withItems, all, 'targetTiny', whats, 1);
};
