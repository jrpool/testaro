/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

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
exports.reporter = async (page, report, _, withItems) => {
  const getBadWhat = element => {
    const styleDec = window.getComputedStyle(element);
    const {textContent} = element;
    // If the element contains 40 or more characters of slanted text:
    if (['italic', 'oblique'].includes(styleDec.fontStyle) && textContent.length > 39) {
      const parent = element.parentElement;
      // If the element has a parent:
      if (parent) {
        // Get the style declaration of the parent.
        const parentStyleDec = window.getComputedStyle(parent);
        const {fontStyle: parentFontStyle} = parentStyleDec;
        // If the parent also has slanted text:
        if (['italic', 'oblique'].includes(parentFontStyle)) {
          // Do not report a violation, because the slant may be inherited.
          return null;
        }
      }
      // If it has no parent or its slant is autonomous, return a violation description.
      return 'Element contains all-slanted text';
    }
  };
  const selector = 'body, body *:not(style, script, svg)';
  const whats = 'Elements contain all-slanted text';
  return await doTest(
    page, report.catalog, withItems, 'allSlanted', selector, whats, 0, getBadWhat.toString()
  );
};
