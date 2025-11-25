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
  pseudoP
  Related to Tenon rule 242.
  This test reports 2 or more sequential br elements. They may be inferior substitutes for a
  p element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body br + br');
  // For each locator:
  for (const loc of all.allLocs) {
    // Return whether the second br element violates the rule.
    const parentTagNameIfBad = await loc.evaluate(el => {
      el.parentElement.normalize();
      const previousSib = el.previousSibling;
      return previousSib.nodeType === Node.ELEMENT_NODE
      || previousSib.nodeType === Node.TEXT_NODE && /^\s+$/.test(previousSib)
        ? el.parentElement.tagName
        : false;
    });
    // If it does:
    if (parentTagNameIfBad) {
      // Add the locator to the array of violators.
      all.locs.push([loc, parentTagNameIfBad]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Adjacent BR elements within a __param__ element may be pseudo-paragraphs',
    'Elements contain 2 or more adjacent br elements that may be pseudo-paragraphs'
  ];
  return await getRuleResult(withItems, all, 'pseudoP', whats, 0, 'br');
};
