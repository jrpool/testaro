/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  captionLoc
  This test reports caption elements that are not the first children of table elements.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const parent = element.parentElement;
    // If the element is not the first child of a table element:
    if (! parent || parent.tagName !== 'TABLE' || parent.firstElementChild !== element) {
      // Return a violation description.
      return 'caption element is not the first child of a table element';
    }
  };
  const whats = 'caption elements are not the first children of table elements';
  return await doTest(
    page, catalog, withItems, 'captionLoc', 'caption', whats, 3, 'CAPTION', getBadWhat.toString()
  );
};
