/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  distortion
  Related to Tenon rule 271.
  This test reports elements whose transform style properties distort the content. Distortion makes text difficult to read.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const styleDec = window.getComputedStyle(element);
    const {transform} = styleDec;
    const badTransformTypes = ['matrix', 'perspective', 'rotate', 'scale', 'skew'];
    // If the element style transforms the text:
    if (transform) {
      const transformType = badTransformTypes.find(key => transform.includes(key));
      // If the transformation is distortive:
      if (transformType) {
        // Return a violation description.
        return `Element distorts its text with ${transformType} transformation`;
      }
    }
  };
  const whats = 'Elements distort their texts';
  return await doTest(
    page, catalog, withItems, 'distortion', 'body *', whats, 0, getBadWhat.toString()
  );
};
