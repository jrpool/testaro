/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  datalistRef
  Report inputs whose list attribute references a missing or ambiguous datalist
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the ID of the datalist element referenced by the list attribute of the element.
    const listID = element.getAttribute('list');
    // If the element has a list attribute with a non-empty value:
    if (listID) {
      // Get the element it references.
      const listElement = document.getElementById(listID);
      // If no such element exists:
      if (! listElement) {
        // Return a violation description.
        return 'input element list attribute references a missing element';
      }
      // Otherwise, if the element it references is not a datalist:
      if (listElement.tagName.toLowerCase() !== 'datalist') {
        // Return a violation description.
        return 'input element list attribute references a non-datalist element';
      }
    }
    // Otherwise, i.e. if it has no list attribute with a non-empty value:
    else {
      // Return a violation description.
      return 'input element list attribute is empty';
    }
  };
  const whats = 'list attributes of input elements are empty or IDs of no or non-datalist elements';
  return await doTest(
    page, withItems, 'datalistRef', 'input[list]', whats, 3, 'INPUT', getBadWhat.toString()
  );
};
