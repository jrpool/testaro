/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  legendLoc
  Clean-room rule.
  This test reports legend elements that are not the first children of fieldset elements.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const parent = element.parentElement;
    // If the element violates the rule:
    if (! (parent && parent.tagName === 'FIELDSET' && parent.firstElementChild === element)) {
      // Return a violation description.
      return 'Element is not the first child of a fieldset element';
    }
  };
  const whats = 'Legend elements are not the first children of fieldset elements';
  return await doTest(
    page, catalog, withItems, 'legendLoc', 'legend', whats, 3, 'LEGEND', getBadWhat.toString()
  );
};
