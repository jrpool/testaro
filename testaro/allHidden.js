/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  allHidden
  This test reports a page that is entirely or mainly hidden.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async page => {
  // Get a count of elements deemed visible by Playwright.
  const visibleElementCount = await page.locator('body :visible').count();
  // If no element is visible:
  if (! visibleElementCount) {
    // Return data, totals, and a summary standard instance.
    return {
      data: {},
      totals: [0, 0, 0, 1],
      standardInstances: [{
        ruleID: 'allHidden',
        what: 'The entire page body is hidden or empty',
        ordinalSeverity: 3,
        count: 1
      }]
    };
  }
  // Otherwise, return data, totals, and an empty array of standard instances.
  return {
    data: {},
    totals: [0, 0, 0, 0],
    standardInstances: []
  };
};
