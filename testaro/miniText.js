/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  miniText
  Derived from the bbc-a11y textCannotBeTooSmall test.
  Related to Tenon rule 134.
  This test reports elements with font sizes smaller than 11 pixels.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const rawText = element.textContent || '';
    // If the element has text content with any non-whitespace:
    if (/[^\s]/.test(rawText)) {
      const isVisible = element.checkVisibility({
        contentVisibilityAuto: true,
        opacityProperty: true,
        visibilityProperty: true
      });
      // If the element is visible:
      if (isVisible) {
        const styleDec = window.getComputedStyle(element);
        // Get its font size.
        const fontSizeString = styleDec.fontSize;
        const fontSize = Number.parseFloat(fontSizeString);
        // If its font size is smaller than 11 pixels:
        if (fontSize < 11) {
          // Return a violation description.
          return `Element is visible but its font size is ${fontSize}px, smaller than 11px`;
        }
      }
    }
  };
  const whats = 'Visible elements have font sizes smaller than 11 pixels';
  return await doTest(
    page, withItems, 'miniText', 'body *:not(script, style)', whats, 2, null, getBadWhat.toString()
  );
};
