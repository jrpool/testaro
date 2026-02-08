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

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (
  page,
  withItems,
  labels = {
    name: ['your name', 'full name', 'first and last name'],
    email: ['email'],
    given: ['first name', 'forename', 'given name'],
    family: ['last name', 'surname', 'family name']
  }
) => {
  const getBadWhat = element => {
    // Get the lower-cased accessible name of the element.
    const accessibleName = window.getAccessibleName(element).toLowerCase();
    const {type} = element;
    let requiredAuto = '';
    // Get its required autocomplete value.
    if (
      type === 'email'
      || accessibleName && labels.email.some(label => accessibleName.includes(label))
    ) {
      requiredAuto = 'email';
    }
    else if (
      accessibleName && type === 'text' && labels.name.some(label => accessibleName.includes(label))
    ) {
      requiredAuto = 'name';
    }
    else if (
      accessibleName
      && type === 'text'
      && labels.given.some(label => accessibleName.includes(label))
    ) {
      requiredAuto = 'given-name';
    }
    else if (
      accessibleName
      && type === 'text'
      && labels.family.some(label => accessibleName.includes(label))
    ) {
      requiredAuto = 'family-name';
    }
    // Get its actual autocomplete value.
    const actualAuto = element.getAttribute('autocomplete');
    // If an autocomplete value is required but not present:
    if (requiredAuto && ! (actualAuto && actualAuto.includes(requiredAuto))) {
      // Return a violation description.
      return `input has no autocomplete="${requiredAuto}" attribute`;
    }
  };
  const selector = 'input[type=text], input[type=email], input:not([type])';
  const whats = 'Inputs are missing required autocomplete attributes';
  return doTest(
    page, catalog, withItems, 'autocomplete', selector, whats, 2, null, getBadWhat.toString()
  );
};
