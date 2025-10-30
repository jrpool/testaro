/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  focVis
  Derived from the bbc-a11y elementsMustBeVisibleOnFocus test.
  This test reports links that are at least partly off the display when focused.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize a sample of locators and a result.
  const all = await init(100, page, 'a:visible');
  // For each locator:
  for (const loc of all.allLocs) {
    // Focus it.
    await loc.focus();
    // Get its location.
    const box = await loc.boundingBox();
    // Get how its element violates the rule, if it does.
    const isBad = [box.x < 0, box.y < 0];
    // If it does:
    if (isBad.some(item => item)) {
      // Add the locator to the array of violators.
      let param;
      if (isBad.every(item => item)) {
        param = 'above and to the left of';
      }
      else if (isBad[0]) {
        param = 'to the left of';
      }
      else {
        param = 'above';
      }
      all.locs.push([loc, param]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Visible link is __param__ the display',
    'Visible links are above or to the left of the display'
  ];
  return await report(withItems, all, 'focVis', whats, 2);
};
