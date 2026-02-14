/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  headingAmb
  Related to ASLint rule headings-sibling-unique.
  This test reports adjacent headings with the same levels and text contents.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  const getBadWhat = element => {
    const {tagName} = element;
    const level = tagName[1];
    const textContent = element.textContent.trim().replace(/\s+/g, ' ');
    const headingTagNames = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    // Initialize the inspected element as the previous element sibling of the element.
    let inspectedElement = element.previousElementSibling;
    // As long as the inspected element exists:
    while (inspectedElement) {
      const inspectedTagName = inspectedElement.tagName;
      // If it is a heading:
      if (headingTagNames.includes(inspectedTagName)) {
        // If it is inferior to the element:
        if (inspectedTagName[1] > level) {
          // Stop inspecting it and start inspecting its previous sibling.
          inspectedElement = inspectedElement.previousElementSibling;
          continue;
        }
        // Otherwise, if its level is the same as that of the element:
        else if (inspectedTagName === tagName) {
          const inspectedTextContent = inspectedElement.textContent.trim().replace(/\s+/g, ' ');
          // If they have identical text contents:
          if (inspectedTextContent === textContent) {
            // Return a violation description.
            return 'Heading has the same text as the prior same-level sibling heading';
          }
        }
        // Otherwise, i.e. if it is superior to the element:
        else {
          // Stop inspecting.
          break;
        }
      }
      // Otherwise, i.e. if it is not a heading:
      else {
        // Inspect its previous sibling.
        inspectedElement = inspectedElement.previousElementSibling;
      }
    }
  };
  const headingLevels = [1, 2, 3, 4, 5, 6];
  const selector = headingLevels.map(level => `body h${level}`).join(', ');
  const whats = 'Adjacent sibling same-level headings have the same text';
  return await doTest(
    page, catalog, withItems, 'headingAmb', selector, whats, 1, getBadWhat.toString()
  );
};
