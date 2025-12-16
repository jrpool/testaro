/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  template
  This test reports ….
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body a');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element violates the rule.
    const isBad = await loc.evaluate(el => el.tabIndex !== 0);
    // If it does:
    if (isBad) {
      // Add the locator to the array of violators.
      all.locs.push(loc);
    }
  }
  // Populate and return the result.
  const whats = ['Itemized description', 'Summary description'];
  return await report(withItems, all, 'ruleID', whats, 0);
};
