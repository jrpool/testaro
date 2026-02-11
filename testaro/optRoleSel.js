/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  optRoleSel
  Clean-room rule.
  This test reports elements with role=option that are missing aria-selected attributes.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // If the element has no aria-selected attribute:
    if (! element.hasAttribute('aria-selected')) {
      // Return a violation description.
      return 'Element has role=option but no aria-selected attribute';
    }
  };
  const whats = 'Elements with role=option have no aria-selected attributes';
  return await doTest(
    page, catalog, withItems, 'optRoleSel', '[role="option"]', whats, 1, getBadWhat.toString()
  );
};
