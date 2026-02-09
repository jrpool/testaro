/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkOldAtt
  This test reports links with deprecated attributes.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const attNames = element.getAttributeNames();
    const allBadAttNames = ['charset', 'coords', 'name', 'rev', 'shape'];
    const elementBadAttNames = allBadAttNames.filter(att => attNames.includes(att));
    // If the element has 1 deprecated attribute:
    if (elementBadAttNames.length === 1) {
      // Return a violation description.
      return `${elementBadAttNames[0]} attribute is deprecated`;
    }
    // Otherwise, if the element has 2 or more deprecated attributes:
    if (elementBadAttNames.length > 1) {
      // Return a violation description.
      return `Element has deprecated attributes: ${elementBadAttNames.join(', ')}`;
    }
  };
  const selector = 'a[charset], a[coords], a[name], a[rev], a[shape]';
  const whats = 'Links have deprecated attributes';
  return await doTest(
    page, catalog, withItems, 'linkOldAtt', selector, whats, 1, 'A', getBadWhat.toString()
  );
};
