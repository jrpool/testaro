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
const {getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  console.log('XXX About to get triggerLocs');
  const triggerLocs = await page.locator([
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
   '[role="tab"]:visible',
   '[role="combobox"]:visible'
  ].join(', '));
  console.log('XXX Got triggerLocs');
  const allLocs = await triggerLocs.all();
  const all = {
    allLocs,
    locs: [],
    result: {
      data: {
        populationRatio: 1
      },
      totals: [0, 0, 0, 0],
      standardInstances: []
    }
  };
  // For each locator:
  for (const loc of allLocs) {
    // Move the mouse to the top left corner of the page.
    await page.mouse.move(0, 0);
    // Get the XPath of the element referenced by the locator.
    let xPath = await loc.evaluate(element => getXPath(element));
    console.log(`XXX xPath ${xPath}`);
    // Change it to the XPath of the desired observation root.
    const pathSegments = xPath.split('/');
    const {length} = pathSegments;
    pathSegments.pop();
    if (! ['main', 'body'].includes(pathSegments[length - 2])) {
      pathSegments.pop();
    }
    xPath = pathSegments.join('/');
    console.log(`XXX New xPath ${xPath}`);
    const rootLoc = page.locator(`xpath=${xPath}`);
    // Get a count of the visible elements in the observation tree.
    const loc0 = await rootLoc.locator('*:visible');
    const elementCount0 = await loc0.count();
    console.log(`XXX elementCount0 ${elementCount0}`);
    try {
      // Hover over the element.
      console.log('XXX About to hover');
      await loc.hover({timeout: 400});
      console.log('XXX hovering');
      // Get a count of the visible elements in the observation tree.
      const loc1 = await rootLoc.locator('*:visible');
      const elementCount1 = await loc1.count();
      console.log(`XXX elementCount1 ${elementCount1}`);
      // Stop hovering over the element.
      console.log('XXX About stop hovering over the element');
      await page.mouse.move(0, 0);
      let settlePromise;
      const timeoutPromise = new Promise(resolve => setTimeout(() => {
        clearTimeout(settlePromise);
        resolve();
      }, 400));
      settlePromise = new Promise(resolve => setInterval(async elementCount1 => {
        const elementCount2 = await loc1.count();
        if (elementCount2 < elementCount1) {
          clearTimeout(timeoutPromise);
          resolve();
        }
      }, 75));
      await Promise.race([timeoutPromise, settlePromise]);
      console.log('XXX no longer hovering over the element');
      // If the count has changed:
      if (elementCount1 !== elementCount0) {
        // Add the locator and a violation description to the array of violation locators.
        const impact = elementCount1 - elementCount0;
        all.locs.push([loc, impact]);
        // Increment the violation count.
        all.result.totals[0]++;
      }
    }
    // If hovering times out:
    catch(error) {
      // Report the test prevented.
      const {data} = all.result;
      data.prevented = true;
      data.error = 'ERROR hovering over an element';
      console.log('XXX Error hovering over an element');
      break;
    }
  }
  // Populate and return the result.
  const whats = [
    'Hovering over the element changes the number of elements on the page by __param__',
    'Hovering over elements changes the number of elements on the page'
  ];
  return await getRuleResult(withItems, all, 'hover', whats, 0);
};
