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
  // Return totals and standard instances for the rule.
  return await page.evaluate(visibleElementCount => {
    let violationCount = 0;
    const instances = [];
    // If no element is visible:
    if (! visibleElementCount) {
      // Increment the violation count.
      violationCount = 1;
      const what = `The entire page body is hidden or empty`;
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'allHidden', what, 1, 3));
    }
    return {
      data: {},
      totals: [0, 0, 0, violationCount],
      standardInstances: instances
    };
  }, visibleElementCount);
};
