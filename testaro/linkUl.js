/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  linkUl
  This test reports failures to underline inline links. Underlining and color are the traditional
  style properties that identify links. Lists of links containing only links can be recognized
  without underlines, but other links are difficult or impossible to distinguish visually from
  surrounding text if not underlined. Underlining adjacent links only on hover provides an
  indicator valuable only to mouse users, and even they must traverse the text with a mouse
  merely to discover which passages are links.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');
// Module to classify links.
const {isInlineLink} = require('../procs/isInlineLink');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'linkUl',
    selector: 'a',
    pruner: async loc => {
      // Get whether each link is underlined.
      const isUnderlined = await loc.evaluate(el => {
        const styleDec = window.getComputedStyle(el);
        return styleDec.textDecorationLine === 'underline';
      });
      // If it is not:
      if (! isUnderlined) {
        // Return whether it is a violator.
        return await isInlineLink(loc);
      }
    },
    complaints: {
      instance: 'Link is inline but has no underline',
      summary: 'Inline links are missing underlines'
    },
    ordinalSeverity: 1,
    summaryTagName: 'A'
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
