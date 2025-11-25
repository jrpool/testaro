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
  focOp
  Related to Tenon rule 190.

  This test reports Tab-focusable elements that are not operable. The standard practice is to make
  focusable elements operable. If focusable elements are not operable, users are likely to be
  surprised that nothing happens when they try to operate such elements. The test considers an
  element operable if it has a non-inherited pointer cursor and is not a 'LABEL' element, has an
  operable tag name, has an interactive explicit role, or has an 'onclick' attribute. The test
  considers an element Tab-focusable if its tabIndex property has the value 0.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Module to get operabilities.
const {isOperable} = require('../procs/operable');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body *');
  all.result.data.focusableCount = 0;
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element is focusable.
    const isFocusable = await loc.evaluate(el => el.tabIndex === 0);
    // If it is:
    if (isFocusable) {
      // Add this to the report.
      all.result.data.focusableCount++;
      // Get whether it is operable.
      const howOperable = await isOperable(loc);
      // If it is not:
      if (! howOperable.length) {
        // Add the locator to the array of violators.
        all.locs.push(loc);
      }
    }
  }
  // Populate and return the result.
  const whats = [
    'Element is Tab-focusable but not operable', 'Elements are Tab-focusable but not operable'
  ];
  const result = await getRuleResult(withItems, all, 'focOp', whats, 2);
  return result;
};
