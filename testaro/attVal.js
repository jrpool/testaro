/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  attVal
  This test reports elements with illicit values of an attribute.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems, attributeName, areLicit, values) => {
  const getBadWhat = element => {
    // Get the value of the attribute.
    const value = element.getAttribute(attributeName);
    // If it violates the rule:
    if (areLicit !== values.includes(value)) {
      // Return a violation description.
      return `Element has attribute ${attributeName} with illicit value ${value}`;
    }
  };
  const whats = `Elements have attribute ${attributeName} with illicit values`;
  return await doTest(
    page, catalog, withItems, 'attVal', `[${attributeName}]`, whats, 2, getBadWhat.toString()
  );
};
