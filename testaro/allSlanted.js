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
  This test reports elements with italic or oblique text at least 40 characters long. Blocks of slanted text are difficult to read.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const styleDec = window.getComputedStyle(element);
    const {textContent} = element;
    // If the element contains 40 or more characters of slanted text:
    if (['italic', 'oblique'].includes(styleDec.fontStyle) && textContent.length > 39) {
      // Return a violation description.
      return 'Element contains all-slanted text';
    }
  };
  const selector = 'body *:not(style, script, svg)';
  const whats = 'Elements contain all-slanted text';
  return await doTest(
    page, catalog, withItems, 'allSlanted', selector, whats, 0, getBadWhat.toString()
  );
};
