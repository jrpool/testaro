/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  zIndex
  This test reports elements with non-auto z indexes. It assumes that pages are most accessible
  when they do not require users to perceive a third dimension (depth). Layers, popups, and dialogs
  that cover other content make it difficult for some or all users to interpret the content and
  know what parts of the content can be acted on. Layering also complicates accessibility control.
  Tests for visibility of focus, for example, may fail if incapable of detecting that a focused
  element is covered by another element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body *');
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element violates the rule.
    const badZ = await loc.evaluate(el => {
      const styleDec = window.getComputedStyle(el);
      const {zIndex} = styleDec;
      return zIndex !== 'auto' ? zIndex : null;
    });
    // If it does:
    if (badZ) {
      // Add the locator to the array of violators.
      all.locs.push([loc, badZ]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Element has a non-default Z index (__param__)', 'Elements have non-default Z indexes'
  ];
  return await getRuleResult(withItems, all, 'zIndex', whats, 0);
};
