/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or   https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkUl
  This test reports failures to underline inline links. Underlining and color are the traditional style properties that identify links. Lists of links containing only links may be recognizable without underlines, but other links are difficult or impossible to distinguish visually from surrounding text if not underlined. Underlining adjacent links only on hover provides an indicator valuable only to mouse users, and even they must traverse the text with a mouse merely to discover which passages are links.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const liAncestor = element.closest('li');
    // If the element is not the only link inside a list item:
    if (! (liAncestor && liAncestor.getElementsByTagName('a').length === 1)) {
      const styleDec = window.getComputedStyle(element);
      const {textDecoration} = styleDec;
      // If the element text is not underlined:
      if (! textDecoration.includes('underline')) {
        const styleDec = window.getComputedStyle(element);
        const {display} = styleDec;
        // If the element has does not have a block display style:
        if (display !== 'block') {
          // Return a violation description.
          return 'Element is not a list item but is not underlined';
        }
      }
    }
  };
  const whats = 'Links that are not list items are not underlined';
  return await doTest(
    page, catalog, withItems, 'linkUl', 'a', whats, 1, getBadWhat.toString()
  );
};
