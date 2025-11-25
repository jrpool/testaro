/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

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
  attVal
  This test reports attributes with illicit values.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems, attributeName, areLicit, values) => {
  // Initialize the locators and result.
  const all = await init(100, page, `[${attributeName}]`);
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element violates the rule.
    const value = await loc.getAttribute(attributeName);
    const isBad = areLicit !== values.includes(value);
    // If it does:
    if (isBad) {
      // Add the locator to the array of violators.
      all.locs.push([loc, value]);
    }
  }
  // Populate and return the result.
  const whats = [
    `Element has attribute ${attributeName} with illicit value “__param__”`,
    `Elements have attribute ${attributeName} with illicit values`
  ];
  return await getRuleResult(withItems, all, 'attVal', whats, 2);
};
