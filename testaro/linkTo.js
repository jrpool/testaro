/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/
/*
  linkTo
  This test reports links without href attributes.
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
      // Return a violation description.
      return `Element has no href attribute`;
    }
  };
  const whats = 'Links are missing href attributes';
  return await doTest(
    page, catalog, withItems, 'linkTo', 'a:not([href]', whats, 2, 'A', getBadWhat.toString()
  );
};
