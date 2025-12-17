/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  role
  This test reports elements with native-replacing explicit role attributes.
*/

// IMPORTS

const {elementRoles} = require('aria-query');
const {doTest} = require('../procs/testaro');

// CONSTANTS

// Implicit roles
const implicitRoles = new Set(Array.from(elementRoles.values()).flat());

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the explicit role of the element.
    const role = element.getAttribute('role');
    // If it is also implicit:
    if (implicitRoles.has(role)) {
      // Return a violation description.
      return `Explicit ${role} role of the element is also an implicit HTML element role`;
    }
  };
  const whats = 'Elements have roles assigned that are also implicit HTML element roles';
  return await doTest(page, withItems, 'role', whats, 0, null, getBadWhat.toString());
};
