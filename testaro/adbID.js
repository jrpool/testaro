/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  adbID
  Clean-room rule
  This test reports elements referencing aria-describedby targets that are missing or, because of duplicate IDs, ambiguous. An earlier version of this test was originally developed under a clean-room procedure to ensure its independence from the implementation of a test for a similar rule in the Tenon tool.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    // Get the IDs in the aria-describedby attribute of the element.
    const IDs = element.getAttribute('aria-describedby').trim().split(/\s+/).filter(Boolean);
    // If there are none:
    if (! IDs.length) {
      // Return a violation description.
      return 'Element has an aria-describedby attribute with no value';
    }
    // Otherwise, i.e. if there is at least 1 ID:
    else {
      // For each ID:
      for (const id of IDs) {
        // Get the element with that ID.
        const describer = document.getElementById(id);
        // If it doesn't exist:
        if (! describer) {
          // Return a violation description.
          return `No element has the aria-describedby ID ${id}`;
        }
        // Otherwise, i.e. if it exists:
        else {
          // Get the elements with that ID.
          const sameIDElements = document.querySelectorAll(`#${id}`);
          // If there is more than one:
          if (sameIDElements.length > 1) {
            // Return a violation description.
            return `Multiple elements share the aria-describedby ID ${id}`;
          }
        }
      }
    }
  };
  const whats = 'Elements have aria-describedby attributes with missing or invalid id values';
  return await doTest(
    page, catalog, withItems, 'adbID', '[aria-describedby]', whats, 3, getBadWhat.toString()
  );
};
