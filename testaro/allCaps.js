/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  allCaps
  Related to Tenon rule 153.
  This test reports elements with native upper-case text at least 8 characters long. Blocks of upper-case text are difficult to read.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the child text nodes of the element.
    const childTextNodes = Array.from(element.childNodes).filter(
      node => node.nodeType === Node.TEXT_NODE
    );
    // If any of them contains 8 or more consecutive capital letters:
    if (childTextNodes.some(node => /[A-Z]{8,}/.test(node.nodeValue))) {
      // Return a violation description.
      return 'Element contains all-capital text';
    }
  };
  const selector = 'body, body *:not(style, script, svg)';
  const whats = 'Elements have all-capital text';
  return await doTest(
    page, catalog, withItems, 'allCaps', selector, whats, 0, getBadWhat.toString()
  );
};
