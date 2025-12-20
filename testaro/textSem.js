/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  textSem
  This test reports semantically vague inline elements: i, b, small.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If the element is visible:
    if (isVisible) {
      // If it has text content:
      if (element.textContent.trim().replace(/\s/g, '')) {
        // Return a violation description.
        return `Element type (${element.tagName}) is semantically vague`;
      }
    }
  };
  const selector = 'i, b, small';
  const whats = 'Semantically vague elements i, b, and/or small are used';
  return await doTest(
    page, withItems, 'textSem', selector, whats, 0, null, getBadWhat.toString()
  );
};
