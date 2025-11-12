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
  (called “triggers”) include all the elements that have ARIA attributes associated with control
  over the visibility of other elements and all the elements that have onmouseenter or
  onmouseover attributes, as well as a sample of all visible elements in the body. If hovering over
  an element results in an increase or decrease in the total count of visible elements in the body,
  the rule is considered violated.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const allTrigger = await init(
    20, page, '[aria-controls], [aria-expanded], [aria-haspopup], [onmouseenter], [onmouseover]'
  );
  const allNonTrigger = await init(
    30 - allTrigger.result.data.sampleSize,
    page,
    'body *:not([aria-controls], [aria-expanded], [aria-haspopup], [onmouseenter], [onmouseover])'
  );
  const populationSize
    = allTrigger.result.data.populationSize + allNonTrigger.result.data.populationSize;
  const sampleSize = allTrigger.result.data.sampleSize + allNonTrigger.result.data.sampleSize;
  const all = {
    allLocs: allTrigger.allLocs.concat(allNonTrigger.allLocs),
    locs: [],
    result: {
      data: {
        populationSize,
        sampleSize,
        populationRatio: sampleSize ? populationSize / sampleSize : null
      },
      totals: [0, 0, 0, 0],
      standardInstances: []
    }
  };
  // For each locator:
  for (const loc of all.allLocs) {
    // Get how many elements are added or subtracted when the element is hovered over.
    await page.mouse.move(0, 0);
    const loc0 = page.locator('body *:visible');
    const elementCount0 = await loc0.count();
    // Hover over the element, whether or not covered.
    try {
      await loc.hover({
        force: true,
        timeout: 100
      });
      const loc1 = page.locator('body *:visible');
      const elementCount1 = await loc1.count();
      const additions = elementCount1 - elementCount0;
      // If any elements are added or subtracted:
      if (additions !== 0) {
        // Add the locator and the change of element count to the array of violation locators.
        const impact = additions > 0
          ? `added ${additions} elements to the page`
          : `subtracted ${- additions} from the page`;
        all.locs.push([loc, impact]);
      }
    }
    // If hovering times out:
    catch(error) {
      // Report the test prevented.
      const {data} = all.result;
      data.prevented = true;
      data.error = 'ERROR hovering over an element';
      break;
    }
  }
  // Populate and return the result.
  const whats = [
    'Hovering over the element __param__',
    'Hovering over elements adds elements to or subtracts elements from the page'
  ];
  return await report(withItems, all, 'hover', whats, 0);
};
