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
  This test reports sectioning containers that have child headings of which the first has a depth (i.e. level) lower than at least one of the others. An example is a section element whose first heading child is an h3 element and whose subsequent heading children include an h2 element. The first child heading is presumed the principal heading of the container, so this pattern merits scrutiny.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the children of the element.
    const children = Array.from(element.children);
    // Get the headings among them.
    const headingChildren = children.filter(child => /^H[1-6]$/.test(child.tagName));
    // Get their depths.
    const headingChildDepths = headingChildren.map(child => Number(child.tagName.slice(1)));
    // If there are 2 or more heading children:
    if (headingChildren.length > 1) {
      // Get the depth of the first of them.
      const firstHeadingDepth = headingChildDepths[0];
      // Get the minimum of their depths.
      const minHeadingDepth = Math.min(...headingChildDepths);
      // If any heading is less deep than the first:
      if (minHeadingDepth < firstHeadingDepth) {
        // Return a violation description.
        return `First child heading is H${firstHeadingDepth}, but another is H${minHeadingDepth}`;
      }
    }
  };
  const selector = 'section, article, nav, aside, main';
  const whats = 'First child headings of sectioning containers are deeper than others';
  return await doTest(
    page, catalog, withItems, 'secHeading', selector, whats, 0, null, getBadWhat.toString()
  );
};
