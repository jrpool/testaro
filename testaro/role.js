/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  role
  This test reports elements with native-replacing explicit role attributes. This test uses the getBasicResult function in order to have access to the aria-query dependency.
*/

// IMPORTS

const {elementRoles} = require('aria-query');
const {getBasicResult} = require('../procs/testaro');

// CONSTANTS

// Implicit roles
const implicitRoles = new Set(Array.from(elementRoles.values()).flat());

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  // Get locators for the elements with explicit roles.
  const loc = page.locator('[role]');
  const locs = await loc.all();
  const violations = [];
  // Get data on those with roles that are also implicit.
  for (const loc of locs) {
    const roleSpec = await loc.getAttribute('role');
    const roles = roleSpec.split(/\s+/);
    const badRole = roles.find(role => implicitRoles.has(role));
    if (badRole) {
      violations.push({
        loc,
        what: `Explicit ${badRole} role of the element is also an implicit HTML element role`
      });
    }
  }
  // Get and return a result.
  const whats = 'Elements have roles assigned that are also implicit HTML element roles';
  return await getBasicResult(catalog, withItems, 'role', 0, whats, {}, violations);
};
