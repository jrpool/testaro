/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  headEl
  Related to ASLint rule elements-not-allowed-in-head.
  This test reports invalid descendants of the head of the document.
*/

// ########## FUNCTIONS

// Performs the test.
exports.reporter = async page => {
  // Initialize the data and standard result.
  const data = {
    total: 0,
    badTagNames: []
  };
  let totals = [];
  const standardInstances = [];
  // Get the tag names of the elements in the head, even if the head tags are omitted.
  const headElTagNames = await page.evaluate(() => {
    const head = document.head;
    const headChildren = head.children;
    const tagNames = [];
    for (const child of headChildren) {
      tagNames.push(child.tagName);
    }
    return tagNames;
  });
  const validTagNames = [
    'BASE',
    'LINK',
    'META',
    'SCRIPT',
    'STYLE',
    'TITLE',
    'NOSCRIPT',
    'TEMPLATE'
  ];
  // For each head child:
  headElTagNames.forEach(tagName => {
    // If it is invalid:
    if (! validTagNames.includes(tagName)) {
      // Add its tag name to the result.
      data.total++;
      data.badTagNames.push(tagName);
    }
  });
  // If there are any instances:
  if (data.total) {
    // Add a summary instance to the standard instances.
    standardInstances.push({
      ruleID: 'headEl',
      what: `Invalid elements within the head: ${data.badTagNames.join(', ')}`,
      ordinalSeverity: 2,
      count: data.total
    });
  }
  totals = [0, 0, data.total, 0];
  // Return the data.
  return {
    data,
    totals,
    standardInstances
  };
};
