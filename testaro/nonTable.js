/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
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
