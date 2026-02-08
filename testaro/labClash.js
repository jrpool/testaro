/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  labClash
  This test reports redundant labeling of buttons, non-hidden inputs, select lists, and text areas. Redundant labels are labels that are superseded by other labels. Explicit and implicit (wrapped) labels are additive, not conflicting.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the label types of the element.
    const labelTypes = [];
    // Attribute and reference labels.
    ['aria-label', 'aria-labelledby'].forEach(type => {
      if (element.hasAttribute(type)) {
        labelTypes.push(type);
      }
    });
    // Explicit and implicit labels.
    const labels = Array.from(element.labels);
    if (labels.length) {
      labelTypes.push('label');
    }
    // If it has more than 1 label type:
    if (labelTypes.length > 1) {
      // Return a violation description.
      return `Element has inconsistent label types (${labelTypes.join(', ')})`;
    }
  };
  const selector = 'button, input:not([type=hidden]), select, textarea';
  const whats = 'Elements have inconsistent label types';
  return await doTest(
    page, catalog, withItems, 'labClash', selector, whats, 2, null, getBadWhat.toString()
  );
};
