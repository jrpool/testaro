/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  phOnly
  Clean-room rule.
  This test reports input elements that have placeholders but no accessible names. The standard for accessible name computation is employed; it accepts title attributes as sources for accessible names. Thus, this test does not report reliance on title attributes for accessible names, although such reliance is generally considered a poor practice.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the accessible name of the element.
    const accessibleName = window.getAccessibleName(element);
    // If there is none:
    if (! accessibleName) {
      // Return a violation description.
      return 'Element has a placeholder but no accessible name';
    }
  };
  const whats = 'input elements have placeholders but no accessible names';
  return await doTest(
    page, catalog, withItems, 'phOnly', 'input[placeholder]', whats, 2, getBadWhat.toString()
  );
};
