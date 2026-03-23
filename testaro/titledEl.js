/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  titledEl
  This test reports suspicious use of title attributes.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const elementType = element.tagName.toLowerCase();
    // Return a violation description.
    return `Likely ineffective title attribute is used on the ${elementType} element`;
  }
  const selector = '[title]:not(iframe, link, style)';
  const whats = 'title attributes are used on elements they are likely ineffective on';
  return await doTest(
    page, catalog, withItems, 'titledEl', selector, whats, 0, getBadWhat.toString()
  );
};
