/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  bulk
  This test reports the count of visible elements. The test assumes that simplicity and compactness, with one page having one purpose, is an accessibility virtue. Users with visual, motor, and cognitive disabilities often have trouble finding what they want or understanding the purpose of a page if the page is cluttered with content.
*/

// Runs the test and returns the result.
exports.reporter = async page => {
  // Get a count of elements deemed visible by Playwright.
  const visibleElementCount = await page.locator('body :visible').count();
  // Convert the count to a severity level, treating up to 400 as non-reportable.
  const severity = Math.min(4, Math.round(visibleElementCount / 400)) - 1;
  const totals = [0, 0, 0, 0];
  // If the severity is reportable:
  if (severity > -1) {
    totals[severity] = 1;
    // Return data, totals, and a summary standard instance.
    return {
      data: {},
      totals,
      standardInstances: [{
        ruleID: 'bulk',
        what: `Page contains ${visibleElementCount} visible elements`,
        ordinalSeverity: severity,
        count: 1
      }]
    };
  }
  // Otherwise, return data, totals, and an empty array of standard instances.
  return {
    data: {},
    totals,
    standardInstances: []
  };
};
