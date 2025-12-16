/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  bulk
  This test reports the count of visible elements.

  The test assumes that simplicity and compactness, with one page having one purpose,
  is an accessibility virtue. Users with visual, motor, and cognitive disabilities
  often have trouble finding what they want or understanding the purpose of a page
  if the page is cluttered with content.
*/
exports.reporter = async page => {
  // Get a count of elements deemed visible by Playwright.
  const visibleElementCount = await page.locator(':visible').count();
  // Get totals and an instance.
  const violationData = await page.evaluate(visibleElementCount => {
    // Convert the count to a severity level, treating up to 400 as non-reportable.
    const severity = Math.min(4, Math.round(visibleElementCount / 400)) - 1;
    const totals = [0, 0, 0, 0];
    const instances = [];
    // If the severity is reportable:
    if (severity > -1) {
      totals[severity] = 1;
      const what = `Page contains ${visibleElementCount} visible elements`;
      // Create an instance reporting it.
      instances.push(window.getInstance(document.documentElement, 'bulk', what, 1, severity));
    }
    return {
      totals,
      instances
    };
  }, visibleElementCount);
  const {totals, instances} = violationData;
  // Return the result.
  return {
    data: {},
    totals,
    standardInstances: instances
  };
};
