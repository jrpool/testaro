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

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // If the element contains another table:
    if (element.querySelector('table')) {
      // Return a violation description.
      return 'Element contains another table';
    }
    const rowCount = element.querySelectorAll('tr').length;
    const columnCount = Math.max(
      ... Array
      .from(element.querySelectorAll('tr'))
      .map(row => Array.from(row.querySelectorAll('th, td')).length)
    );
    // Otherwise, if it has only 1 column or 1 row:
    if (rowCount === 1 || columnCount === 1) {
      // Return a violation description.
      return 'Element has only one row or one column';
    }
    // Otherwise, if it contains an object or player:
    if (element.querySelector('object, embed, applet, audio, video')) {
      // Return a violation description.
      return 'Element contains an object or player';
    }
    const role = element.getAttribute('role');
    // Otherwise, if it has no table-compatible explicit role or descendant element:
    if (! (
      ['grid', 'treegrid'].includes(role)
      || element.caption
      || element.querySelector('col, colgroup, tfoot, th, thead')
    )) {
      // Return a violation description.
      return 'Element has no table-compatible explicit role or descendant element';
    }
  };
  const whats = 'table elements are misused for non-table content';
  return await doTest(
    page, catalog, withItems, 'nonTable', 'table', whats, 2, 'TABLE', getBadWhat.toString()
  );
};
