/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or   https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkUl
  This test reports failures to underline links that have adjacent text. Underlining and color are the traditional style properties that identify links. A link whose text is the entire text of its block may be recognizable without underlining, but otherwise links are difficult or impossible to distinguish visually from surrounding text if not underlined. Underlining links only on hover provides an indicator valuable only to mouse users, and even they must traverse the text with a mouse merely to discover which passages are links.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    let {display, textDecorationLine} = window.getComputedStyle(element);
    // If the element is not underlined:
    if (! textDecorationLine.includes('underline')) {
      let ancestor = element;
      // Get its closest non-inline ancestor.
      while (display === 'inline') {
        ancestor = ancestor.parentElement;
        display = ancestor ? window.getComputedStyle(ancestor).display : null;
      }
      // Removes superfluous whitespace from a string.
      const compact = string => string?.replace(/\s+/g, ' ')?.trim();
      // If the rendered compacted text of that ancestor includes more than that of the element:
      if (
        compact(element.textContent) !== compact(ancestor?.textContent)
        && compact(element.innerText) !== compact(ancestor?.innerText)
      ) {
        // Return a violation description.
        return 'Element has adjacent text but is not underlined';
      }
    }
  };
  const whats = 'Links with adjacent text are not underlined';
  return await doTest(
    page, catalog, withItems, 'linkUl', 'body a', whats, 1, getBadWhat.toString()
  );
};
