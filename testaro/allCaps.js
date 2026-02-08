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
    // Get the concatenation of their texts that contain 8 or more consecutive letters.
    let longText = childTextNodes
    .map(node => node.nodeValue.trim())
    .filter(text => /[A-Z]{8,}/i.test(text))
    .join(' ');
    // If there is any:
    if (longText) {
      // Get the style declaration of the element.
      const styleDec = window.getComputedStyle(element);
      const {textTransform} = styleDec;
      // If the style declaration transforms the text to upper case:
      if (textTransform === 'uppercase') {
        // Return a violation description.
        return 'Element text is rendered as all-capital';
      }
      // Otherwise, if the text contains 8 or more consecutive upper-case letters:
      if (/[A-Z]{8,}/.test(longText)) {
        // Return a violation description.
        return 'Element contains all-capital text';
      }
    }
  };
  const selector = 'body *:not(style, script, svg)';
  const whats = 'Elements have all-capital text';
  return await doTest(
    page, catalog, withItems, 'allCaps', selector, whats, 0, null, getBadWhat.toString()
  );
};
