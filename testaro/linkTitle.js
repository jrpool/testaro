/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkTitle
  Related to Tenon rule 79.
  This test reports links with title attributes whose values the link text contains.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');
// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'linkTitle',
    selector: 'a[title]',
    pruner: async loc => {
      const elData = await getLocatorData(loc);
      const title = await loc.getAttribute('title');
      return elData.excerpt.toLowerCase().includes(title.toLowerCase());
    },
    complaints: {
      instance: 'Link has a title attribute that repeats link text content',
      summary: 'Links have title attributes that repeat link text contents'
    },
    ordinalSeverity: 0,
    summaryTagName: 'A'
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
