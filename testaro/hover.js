/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  hover
  This test reports unexpected impacts of hovering. The elements that are subjected to hovering (called “triggers”) include all the elements that have attributes associated with control over the visibility of other elements. If hovering over an element results in an increase or decrease in the total count of visible elements in the tree rooted in the grandparent of the trigger, the rule is considered violated. This test uses the getBasicResult function in order to use Playwright for the most realistic hover simulation.
*/

// IMPORTS

// Module to perform common operations.
const {getBasicResult, getVisibleCountChange} = require('../procs/testaro');
// Module to perform Playwright operations.
const playwright = require('playwright');

// FUNCTIONS

// Gets a violation description.
const getViolationDescription = (change, elapsedTime) =>
  `Hovering over the element changes the related visible element count by ${change} in ${elapsedTime}ms`;
// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const candidateLocs = await page.locator([
   '[aria-controls]:visible',
   '[aria-expanded]:visible',
   '[aria-haspopup]:visible',
   '[onmouseenter]:visible',
   '[onmouseover]:visible',
   '[onpointerenter]:visible',
   '[onpointerover]:visible',
   '[role="menu"]:visible',
   '[role="menubar"]:visible',
   '[role="menuitem"]:visible',
   '[data-tooltip]:visible',
   '[data-popover]:visible',
   '[data-hover]:visible',
   '[data-menu]:visible',
   '[data-dropdown]:visible',
   '[role=tab]:visible',
   '[role=combobox]:visible'
  ].join(', '));
  const allLocs = await candidateLocs.all();
  const violations = [];
  const data = {
    hoverableCount: allLocs.length
  };
  // For each locator:
  for (const loc of allLocs) {
    // Get the XPath of the element referenced by the locator.
    let xPath = await loc.evaluate(element => getXPath(element));
    const pathSegments = xPath.split('/');
    const {length} = pathSegments;
    // Change it to the XPath of the desired observation root.
    pathSegments.pop();
    if (! ['main', 'body'].includes(pathSegments[length - 2])) {
      pathSegments.pop();
    }
    xPath = pathSegments.join('/');
    // Get a locator for the observation root.
    const rootLoc = page.locator(`xpath=${xPath}`);
    const loc0 = await rootLoc.locator('*:visible');
    // Get a pre-hover count of the visible elements in the observation tree.
    const elementCount0 = await loc0.count();
    try {
      // Hover over the element.
      await loc.hover({timeout: 400});
      // Get the change in the count of the visible elements in the observation tree.
      const changeData = await getVisibleCountChange(rootLoc, elementCount0, 400, 75);
      const {change, elapsedTime} = changeData;
      // If a change occurred:
      if (change) {
        // Add the locator and a violation description to the array of violations.
        violations.push({
          loc,
          what: getViolationDescription(change, elapsedTime)
        });
      }
      // Stop hovering over the element.
      await page.mouse.move(0, 0);
      // Await a reverse change in the count of the visible elements in the observation tree.
      await getVisibleCountChange(rootLoc, elementCount0 + change);
    }
    // If hovering throws an error:
    catch(error) {
      // If the error is a timeout:
      if (error instanceof playwright.errors.TimeoutError) {
        // Skip the locator.
        continue;
      }
      // Otherwise, i.e. if the error is not a timeout, report this and quit.
      data.prevented = true;
      data.error = `ERROR hovering over an element (${error.message.slice(0, 200)})`;
      break;
    }
  }
  // Get and return a result.
  const whats = 'Hovering over elements changes the number of related visible elements';
  return await getBasicResult(page, withItems, 'hover', 0, '', whats, data, violations);
};
