/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/*
  hover
  This test reports unexpected impacts of hovering. The elements that are subjected to hovering
  (called “triggers”) include all the elements that have attributes associated with control over
  the visibility of other elements. If hovering over an element results in an increase or decrease
  in the total count of visible elements in the tree rooted in the grandparent of the trigger,
  the rule is considered violated.
*/

// ########## IMPORTS

// Module to perform common operations.
const {getBasicResult, getVisibleCountChange} = require('../procs/testaro');

// ########## FUNCTIONS

// Gets a violation description.
const getViolationDescription = change =>
  `Hovering over the element changes the number of related visible elements by ${change}`;
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
  const preventionData = {};
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
    // Get a count of the visible elements in the observation tree.
    const elementCount0 = await loc0.count();
    try {
      // Hover over the element.
      await loc.hover({timeout: 400});
      // Get the change in the count of the visible elements in the observation tree.
      const change = await getVisibleCountChange(rootLoc, elementCount0, 400, 75);
      // If a change occurred:
      if (change) {
        // Add the locator and a violation description to the array of violations.
        violations.push([loc, getViolationDescription(change)]);
      }
      // Stop hovering over the element.
      await page.mouse.move(0, 0);
      // Await a change in the count of the visible elements in the observation tree.
      await getVisibleCountChange(rootLoc, elementCount0 + change);
    }
    // If hovering times out:
    catch(error) {
      // Report that the test was prevented.
      preventionData.prevented = true;
      preventionData.error = 'ERROR hovering over an element';
      break;
    }
  }
  // Get and return a result.
  const whats = 'Hovering over elements changes the number of related visible elements';
  return await getBasicResult(page, withItems, 'hover', 0, '', whats, preventionData, violations);
};
