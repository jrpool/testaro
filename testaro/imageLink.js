/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025 Jonathan Robert Pool

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  imageLink
  Clean-room rule.
  This test reports links whose destinations are image files.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const href = element.getAttribute('href') || '';
    // If the destination of the element is an image file:
    if (/\.(?:png|jpe?g|gif|svg|webp|ico)(?:$|[?#])/i.test(href)) {
      // Return a violation description.
      return 'Link destination is an image file';
    }
  };
  const whats = 'Links have image files as their destinations';
  return await doTest(
    page, catalog, withItems, 'imageLink', 'a[href]', whats, 0, 'A', getBadWhat.toString()
  );
};
