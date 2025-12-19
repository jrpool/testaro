/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  distortion
  Related to Tenon rule 271.
  This test reports elements whose transform style properties distort the content. Distortion makes text difficult to read.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'distortion',
    selector: 'body *',
    pruner: async loc => await loc.evaluate(el => {
      const styleDec = window.getComputedStyle(el);
      const {transform} = styleDec;
      return transform
      && ['matrix', 'perspective', 'rotate', 'scale', 'skew'].some(key => transform.includes(key));
    }),
    complaints: {
      instance: 'Element distorts its text',
      summary: 'Elements distort their texts'
    },
    ordinalSeverity: 1,
    summaryTagName: ''
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
