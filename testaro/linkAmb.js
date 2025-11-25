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
  linkAmb
  Related to Tenon rule 98.
  This test reports text contents that are shared by links with distinct destinations.
  Text contents are compared case-insensitively.
*/

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'a[href]:visible');
  const linksData = [];
  // For each locator:
  for (const loc of all.allLocs) {
    // Get its text.
    const elData = await getLocatorData(loc);
    const linkText = elData.excerpt.toLowerCase();
    // Get its destination.
    const linkTo = await loc.getAttribute('href');
    // If the text and destination exist:
    if (linkText && linkTo) {
      // If a previous link has the same text but a different destination:
      if (linksData.some(linkData => linkData.text === linkText && linkData.to !== linkTo)) {
        // Add the locator to the array of violators.
        all.locs.push(loc);
      }
      // Otherwise, i.e. if no previous link has the same taxt but a different destination:
      else {
        // Record its text and destination.
        linksData.push({
          text: linkText,
          to: linkTo
        });
      }
    }
  }
  // Populate and return the result.
  const whats = [
    'Link has the same text as, but a different destination from, another',
    'Links have the same texts but different destinations'
  ];
  return await getRuleResult(withItems, all, 'linkAmb', whats, 2);
};
