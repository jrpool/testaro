/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  allSlanted
  Related to Tenon rule 154.
  This test reports elements with italic or oblique text at least 40 characters long. Blocks of
  slanted text are difficult to read.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'allSlanted',
    selector: 'body *:not(style, script, svg)',
    pruner: async loc => await loc.evaluate(el => {
      const elStyleDec = window.getComputedStyle(el);
      const elText = el.textContent;
      return ['italic', 'oblique'].includes(elStyleDec.fontStyle) && elText.length > 39;
    }),
    complaints: {
      instance: 'Element contains all-italic or all-oblique text',
      summary: 'Elements contain all-italic or all-oblique text'
    },
    ordinalSeverity: 0,
    summaryTagName: ''
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
