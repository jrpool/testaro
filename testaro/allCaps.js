/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  allCaps
  Related to Tenon rule 153.
  This test reports elements with native or transformed upper-case text at least 8 characters long. Blocks of upper-case text are difficult to read.
*/

// ########## IMPORTS

// Module to perform common operations.
const {simplify} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Specify the rule.
  const ruleData = {
    ruleID: 'allCaps',
    selector: 'body *:not(style, script, svg)',
    pruner: async loc => await loc.evaluate(el => {
      // Get the concatenated and debloated text content of the element and its child text nodes.
      const elText = Array
      .from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(textNode => textNode.nodeValue)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/-{2,}/g, '-');
      // If the element text includes 8 sequential upper-case letters, spaces, or hyphen-minuses:
      if (/[- A-Z]{8}/.test(elText)) {
        // Report this.
        return true;
      }
      // Otherwise:
      else {
        // Report whether its text is at least 8 characters long and transformed to upper case.
        const elStyleDec = window.getComputedStyle(el);
        const transformStyle = elStyleDec.textTransform;
        return transformStyle === 'uppercase' && elText.length > 7;
      }
    }),
    complaints: {
      instance: 'Element contains all-capital text',
      summary: 'Elements contain all-capital text'
    },
    ordinalSeverity: 0,
    summaryTagName: ''
  };
  // Run the test and return the result.
  return await simplify(page, withItems, ruleData);
};
