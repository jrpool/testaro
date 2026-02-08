/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  hr
  This test reports the use of hr elements.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Return a violation description.
    return `hr element is used for vertical segmentation`;
  }
  const whats = 'HR elements are used for vertical segmentation';
  return await doTest(
    page, catalog, withItems, 'hr', 'hr', whats, 0, 'HR', getBadWhat.toString()
  );
};
