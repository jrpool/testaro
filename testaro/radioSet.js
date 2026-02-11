/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  radioSet
  This test reports nonstandard groupings of radio buttons. It defines a standard grouping to require that two or more radio buttons with the same name, and no other radio buttons, be grouped in a fieldset element with a valid legend element.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the name of the element.
    const elName = element.name;
    // If it has none:
    if (! elName) {
      // Return a violation description.
      return 'radio button has no name attribute';
    }
    // Identify the field set of the element.
    const elFS = element.closest('fieldset');
    // If it has none:
    if (! elFS) {
      // Return a violation description.
      return 'radio button is not in a field set';
    }
    // Get the first child element of the field set.
    const fsChild1 = elFS.firstElementChild;
    // Get whether the child is a legend with text content.
    const legendOK = fsChild1.tagName === 'LEGEND'
    && fsChild1.textContent.replace(/\s/g, '').length;
    // If it is not:
    if (! legendOK) {
      // Return a violation description.
      return 'radio button is in a field set without a valid legend';
    }
    // Get the count of radio buttons with the same name in the field set.
    const nameGroupSize = elFS.querySelectorAll(`input[type=radio][name=${elName}]`).length;
    // If the count is only 1:
    if (nameGroupSize === 1) {
      // Return a violation description.
      return 'radio button is the only one with its name in its field set';
    }
    // Get the count of radio buttons in the field set.
    const groupSize = elFS.querySelectorAll('input[type=radio]').length;
    // If it is greater than the count of radio buttons with the same name in the field set:
    if (groupSize > nameGroupSize) {
      // Return a violation description.
      return 'radio button shares a field set with differently named others';
    }
    // Get the count of radio buttons with the same name in the document.
    const nameDocSize = document.querySelectorAll(`input[type=radio][name=${elName}]`).length;
    // If it is greater, and thus some such radio button is outside the field set:
    if (nameDocSize > nameGroupSize) {
      // Return a violation description.
      return 'radio button shares a name with others outside its field set';
    }
  };
  const whats = 'Radio buttons are not validly grouped in fieldsets with legends';
  return await doTest(
    page, catalog, withItems, 'radioSet', 'input[type=radio]', whats, 2, getBadWhat.toString()
  );
};
