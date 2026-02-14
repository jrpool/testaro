/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  docType
  Derived from the bbc-a11y allDocumentsMustHaveAW3cRecommendedDoctype test.
  This test reports a failure to equip the page document with a W3C-recommended HTML doctype.
*/

// Runs the test and returns the result.
exports.reporter = async page => {
  // Returns whether the page declares a document type.
  const docHasType = await page.evaluate(() => {
    const docType = document.doctype;
    const docHasType = !! docType && docType.name && docType.name.toLowerCase() === 'html';
    return docHasType;
  });
  // Return data, totals, and, if no document type is declared, a standard instance.
  return {
    data: {docHasType},
    totals: [0, 0, 0, docHasType ? 0 : 1],
    standardInstances: docHasType ? [] : [{
      ruleID: 'docType',
      what: 'Document has no standard HTML doctype preamble',
      ordinalSeverity: 3,
      count: 1
    }]
  };
};
