/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  headingAmb
  Related to ASLint rule headings-sibling-unique.
  This test reports adjacent headings with the same levels and text contents.
*/

// ########## IMPORTS

// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Performs the test.
exports.reporter = async (page, catalog, withItems) => {
  // Initialize the standard result.
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Get locators for all the headings.
  const headingLevels = [1, 2, 3, 4, 5, 6];
  const locAll = page.locator(headingLevels.map(level => `body h${level}`).join(', '));
  const locsAll = await locAll.all();
  const ambIndexes = await locAll.evaluateAll(headings => {
    // Initialize the array of indexes of violating headings.
    const badIndexes = [];
    // For each heading:
    headings.forEach((heading, index) => {
      // Get its level.
      const level = heading.tagName[1];
      // Get the prior headings.
      const priorHeadings = headings.slice(0, index);
      // Get the non-inferior ones among them.
      const nonInferiors = priorHeadings.filter(priorHeading => priorHeading.tagName[1] <= level);
      // If there are any:
      const nonInferiorCount = nonInferiors.length;
      if (nonInferiorCount) {
        // Get the last of them.
        const prior = nonInferiors[nonInferiorCount - 1];
        // If they have the same level and text:
        if (['tagName', 'textContent'].every(property => prior[property] === heading[property])) {
          // Add the index of the later heading to the index of violating headings.
          badIndexes.push(index);
        }
      }
    });
    return badIndexes;
  });
  // If there were any instances:
  if (ambIndexes.length) {
    // Add to the totals.
    totals[1] = ambIndexes.length;
    // If itemization is required:
    if (withItems) {
      // For each instance:
      for (const index of ambIndexes) {
        // If it exists:
        const loc = locsAll[index];
        if (loc) {
          // Get data on the element.
          const elData = await getLocatorData(loc);
          // Add a standard instance.
          standardInstances.push({
            ruleID: 'headingAmb',
            what: 'Heading has the same text as the prior same-level sibling heading',
            ordinalSeverity: 1,
            tagName: elData.tagName,
            id: elData.id,
            location: elData.location,
            excerpt: elData.excerpt
          });
        }
        // Otherwise, i.e. if it does not exist:
        else {
          // Report this.
          console.log('ERROR: Reportedly same-text adjacent sibling heading not found');
        }
      }
    }
    // Otherwise, i.e. if itemization is not required:
    else {
      // Add a summary instance.
      standardInstances.push({
        ruleID: 'headingAmb',
        what: 'Adjacent sibling same-level headings have the same text',
        ordinalSeverity: 1,
        count: totals[1],
        tagName: '',
        id: '',
        location: {
          doc: '',
          type: '',
          spec: ''
        },
        excerpt: ''
      });
    }
  }
  return {
    data,
    totals,
    standardInstances
  };
};
