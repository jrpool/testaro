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
  zIndex
  This test reports elements with non-auto z indexes. It assumes that pages are most accessible
  when they do not require users to perceive a third dimension (depth). Layers, popups, and dialogs
  that cover other content make it difficult for some or all users to interpret the content and
  know what parts of the content can be acted on. Layering also complicates accessibility control.
  Tests for visibility of focus, for example, may fail if incapable of detecting that a focused
  element is covered by another element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body *');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element violates the rule.
    const badZ = await loc.evaluate(el => {
      const styleDec = window.getComputedStyle(el);
      const {zIndex} = styleDec;
      return zIndex !== 'auto' ? zIndex : null;
    });
    // If it does:
    if (badZ) {
      // Add the locator to the array of violators.
      all.locs.push([loc, badZ]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Element has a non-default Z index (__param__)', 'Elements have non-default Z indexes'
  ];
  return await getRuleResult(withItems, all, 'zIndex', whats, 0);
};
