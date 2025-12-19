/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  optRoleSel
  Clean-room rule.
  This test reports elements with role="option" that are missing aria-selected attributes.
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
