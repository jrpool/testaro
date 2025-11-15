/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  optRoleSel
  Clean-room rule: elements with role="option" should have an aria-selected attribute.
*/

const {simplify} = require('../procs/testaro');

exports.reporter = async (page, withItems) => {
  const ruleData = {
    ruleID: 'optRoleSel',
    selector: '[role="option"]',
    pruner: async (loc) => await loc.evaluate(el => {
      return ! el.hasAttribute('aria-selected');
    }),
    complaints: {
      instance: 'Element has an explicit option role but no aria-selected attribute',
      summary: 'Elements with explicit option roles have no aria-selected attributes'
    },
    ordinalSeverity: 1,
    summaryTagName: ''
  };
  return await simplify(page, withItems, ruleData);
};
