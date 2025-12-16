/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  autocomplete
  This test reports failures to equip name and email inputs with correct autocomplete attributes.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (
  page,
  withItems,
  nameLabels = ['your name', 'full name', 'first and last name'],
  emailLabels = ['email'],
  givenLabels = ['first name', 'forename', 'given name'],
  familyLabels = ['last name', 'surname', 'family name']
) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(args => {
    const [withItems, nameLabels,givenLabels, familyLabels, emailLabels] = args;
    // Get all candidates, i.e. text and email input elements.
    const candidates = document.body.querySelectorAll(
      'input[type=text], input[type=email], input:not([type])'
    );
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(candidate => {
      // Get its lower-cased accessible name.
      const name = window.getAccessibleName(candidate).toLowerCase();
      // Get its required autocomplete value.
      let requiredAuto = '';
      if (candidate.type === 'email' || name && emailLabels.some(label => name.includes(label))) {
        requiredAuto = 'email';
      }
      else if (
        name && candidate.type === 'text' && nameLabels.some(label => name.includes(label))
      ) {
        requiredAuto = 'name';
      }
      else if (
        name && candidate.type === 'text' && givenLabels.some(label => name.includes(label))
      ) {
        requiredAuto = 'given-name';
      }
      else if (
        name && candidate.type === 'text' && familyLabels.some(label => name.includes(label))
      ) {
        requiredAuto = 'family-name';
      }
      // Get its actual autocomplete value.
      const actualAuto = candidate.getAttribute('autocomplete');
      // If an autocomplete value is required but not present:
      if (requiredAuto && ! (actualAuto && actualAuto.includes(requiredAuto))) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = `input has no autocomplete="${requiredAuto}" attribute`;
          // Add an instance to the instances.
          instances.push(window.getInstance(candidate, 'autocomplete', what, 1, 2));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'Inputs are missing required autocomplete attributes';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'autocomplete', what, violationCount, 2));
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      standardInstances: instances
    }
  }, [withItems, nameLabels, givenLabels, familyLabels, emailLabels]);
};
