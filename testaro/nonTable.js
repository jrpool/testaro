/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  nonTable
  Derived from the bbc-a11y useTablesForData test. Crude heuristics omitted.
  This test reports tables used for layout.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'nonTable',
    selector: 'table',
    pruner: async loc => await loc.evaluate(el => {
      const role = el.getAttribute('role');
      // If it contains another table:
      if (el.querySelector('table')) {
        // Return misuse.
        return true;
      }
      // Otherwise, if it has only 1 column or 1 row:
      else if (
        el.querySelectorAll('tr').length === 1
        || Math.max(
          ... Array
          .from(el.querySelectorAll('tr'))
          .map(row => Array.from(row.querySelectorAll('th, td')).length)
        ) === 1
      ) {
        // Return misuse.
        return true;
      }
      // Otherwise, if it contains an object or player:
      else if (el.querySelector('object, embed, applet, audio, video')) {
        // Return misuse.
        return true;
      }
      // Otherwise, if it contains a table-compatible element:
      else if (
        el.caption
        || ['grid', 'treegrid'].includes(role)
        || el.querySelector('col, colgroup, tfoot, thead, th')
      ) {
        // Return validity.
        return false;
      }
      // Otherwise:
      else {
        // Return misuse.
        return true;
      }
    }),
    complaints: {
      instance: 'Table is misused to arrange content',
      summary: 'Tables are misused to arrange content'
    },
    ordinalSeverity: 2,
    summaryTagName: 'TABLE'
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
