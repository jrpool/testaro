/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  lineHeight
  Related to Tenon rule 144.
  This test reports elements whose line heights are less than 1.5 times their font sizes. Even such elements with no text create accessibility risk, because any text node added to one of them would have a substandard line height. Nonetheless, elements with no non-spacing text in their subtrees are excluded.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get whether the element has a non-spacing child text node.
    const hasText = Array.from(element.childNodes).some(child =>
      child.nodeType === Node.TEXT_NODE && child.textContent.trim()
    );
    // If so:
    if (hasText) {
      // Get its relevant style properties.
      const styleDec = window.getComputedStyle(element);
      const {fontSize, lineHeight} = styleDec;
      const fontSizeNum = Number.parseFloat(fontSize);
      const lineHeightNum = Number.parseFloat(lineHeight);
      // Get whether it violates the rule.
      const isBad = lineHeightNum < 1.495 * fontSizeNum;
      // If it does:
      if (isBad) {
        const whatFontSize = `font size (${fontSizeNum.toFixed(1)}px)`;
        const whatLineHeight = `line height (${lineHeightNum.toFixed(1)}px)`;
        // Return a violation description.
        return `Element ${whatLineHeight} is less than 1.5 times its ${whatFontSize}`;
      }
    }
  };
  const whats = 'Element line heights are less than 1.5 times their font sizes';
  return await doTest(
    page, withItems, 'lineHeight', '*', whats, 1, null, getBadWhat.toString()
  );
};
