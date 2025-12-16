/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  attVal
  This test reports elements with illicit values of an attribute.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems, attributeName, areLicit, values) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(args => {
    const [withItems, attributeName, areLicit, values] = args;
    // Get all candidates, i.e. elements with the attribute.
    const candidates = document.body.querySelectorAll(`[${attributeName}]`);
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      const value = element.getAttribute(attributeName);
      // If it violates the rule:
      if (areLicit !== values.includes(value)) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = `Element has attribute ${attributeName} with illicit value ${value}`;
          instances.push(window.getInstance(element, 'attVal', what, 1, 2));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = `Elements have attribute ${attributeName} with illicit values`;
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'attVal', what, violationCount, 2));
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      standardInstances: instances
    };
  }, [withItems, attributeName, areLicit, values]);
};
