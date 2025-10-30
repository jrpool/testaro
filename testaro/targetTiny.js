/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  targetTiny
  Related to Tenon rule 152.
  This test reports visible buttons, inputs, and non-inline links with widths or heights smaller
  than 24 pixels.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');
// Module to classify links.
const {isTooSmall} = require('../procs/target');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'a:visible, button:visible, input:visible');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get data on it if illicitly small.
    const sizeData = await isTooSmall(loc, 24);
    // If it is:
    if (sizeData) {
      // Add the locator to the array of violators.
      all.locs.push([loc, `${sizeData.width} wide by ${sizeData.height} high`]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Interactive element pixel size (__param__) is less than 24 by 24',
    'Interactive elements are smaller than 24 pixels wide and high'
  ];
  return await report(withItems, all, 'targetTiny', whats, 1);
};
