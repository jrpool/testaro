/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or   https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkUl
  This test reports failures to underline inline links. Underlining and color are the traditional style properties that identify links. Lists of links containing only links may be recognizable without underlines, but other links are difficult or impossible to distinguish visually from surrounding text if not underlined. Underlining links only on hover provides an indicator valuable only to mouse users, and even they must traverse the text with a mouse merely to discover which passages are links.
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
      // Links wrapping block content (cards, banners) do not need underlines for recognizability.
      const linkStyle = window.getComputedStyle(element);
      if (linkStyle.display === 'block') {
        return;
      }
      // Walk the link and its inline ancestors, stopping at the first non-inline ancestor (inclusive). text-decoration propagates within an inline formatting context but does not cross block-level or atomic-inline boundaries, so any underline beyond the first such ancestor would not paint a line through this link.
      let cur = element;
      while (cur && cur.nodeType === 1) {
        const cs = cur === element ? linkStyle : window.getComputedStyle(cur);
        if (cs.textDecorationLine.includes('underline')) {
          return;
        }
        if (cur !== element && cs.display !== 'inline') {
          break;
        }
        cur = cur.parentElement;
      }
      return 'Element is not a list item but is not underlined';
    }
  };
  const whats = 'Links that are not list items are not underlined';
  return await doTest(
    page, catalog, withItems, 'linkUl', 'body a', whats, 1, getBadWhat.toString()
  );
};
