/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  focVis
  Derived from the bbc-a11y elementsMustBeVisibleOnFocus test.
  This test reports links that are at least partly off the display when focused.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If the element is visible:
    if (isVisible) {
      // Focus it.
      element.focus();
      const box = element.getBoundingClientRect();
      // If it violates the rule:
      if (box.x < 0 || box.y < 0) {
        // Return a violation description.
        return 'Upper left corner of the element is above or to the left of the display';
      }
    }
  };
  const whats = 'Visible links are above or to the left of the display';
  return await doTest(
    page, catalog, withItems, 'focVis', 'a', whats, 2, 'A', getBadWhat.toString()
  );
};
