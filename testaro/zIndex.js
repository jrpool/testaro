/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  zIndex
  This test reports elements with abnormal Z indexes. It assumes that pages are most accessible when they do not require users to perceive a third dimension (depth). Layers, popups, and dialogs that cover other content make it difficult for some or all users to interpret the content and know what parts of the content can be acted on. Layering also complicates accessibility testing. Tests for visibility of focus, for example, may fail if incapable of detecting that a focused element is covered by another element. Z indexes other than auto and 0 are considered abnormal.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get whether the element violates the rule.
    const styleDec = window.getComputedStyle(element);
    const {zIndex} = styleDec;
    // If the Z index of the element is neither 'auto' nor 0:
    if (! ['auto', '0'].includes(zIndex)) {
      // Return a violation description.
      return `z-index style property of the element is ${zIndex}`;
    }
  };
  const whats = 'Elements have non-default Z indexes';
  return await doTest(
    page, withItems, 'zIndex', 'body *', whats, 0, null, getBadWhat.toString()
  );
};
