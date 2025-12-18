/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  secHeading
  This test reports sectioning containers that have child headings of which the first has a level
  lower than at least one of the others. An example is a section element whose first heading child
  is an h3 element and whose subsequent heading children include an h2 element. The first child
  heading is presumed the principal heading of the container, so this pattern merits scrutiny.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the children of the element.
    const children = Array.from(element.children);
    // Get the headings among them.
    const headingChildren = children.filter(child => /^H[1-6]$/.test(child.tagName));
    // If there are 2 or more of them:
    if (headingChildren.length > 1) {
      // Get the level of the first of them.
      const firstHeadingLevel = Number(headingChildren[0].tagName.slice(1));
      // If any subsequent heading has a higher level:
      if (
        headingChildren.slice(1).some(child => Number(child.tagName.slice(1)) < firstHeadingLevel)
      ) {
        // Return a violation description.
        return `First child heading is H${firstHeadingLevel}, but a later one is higher`;
      }
    }
  };
  const selector = 'SECTION, ARTICLE, NAV, ASIDE, MAIN';
  const whats = 'Highest-level child heading is not the first child heading';
  return await doTest(
    page, withItems, 'secHeading', selector, whats, 0, null, getBadWhat.toString()
  );
};
