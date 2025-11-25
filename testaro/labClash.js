/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

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
  labClash
  This test reports redundant labeling of buttons, non-hidden inputs, select lists, and text areas.
  Redundant labels are labels that are superseded by other labels. Explicit and implicit (wrapped)
  labels are additive, not conflicting.
*/

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'button, input:not([type=hidden]), select, textarea');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get the label types of its element.
    const labelTypes = await loc.evaluate(el => {
      const labelTypes = [];
      // Attribute and reference labels.
      ['aria-label', 'aria-labelledby'].forEach(type => {
        if (el.hasAttribute(type)) {
          labelTypes.push(type);
        }
      });
      // Explicit and implicit labels.
      const labels = Array.from(el.labels);
      if (labels.length) {
        labelTypes.push('label');
      }
      return labelTypes;
    });
    // If it has more than 1:
    if (labelTypes.length > 1) {
      // Add the locator and a list of them to the array of violators.
      all.locs.push([loc, labelTypes.join(', ')]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Element has inconsistent label types (__param__)', 'Elements have inconsistent label types'
  ];
  return await getRuleResult(withItems, all, 'labClash', whats, 2);
};
