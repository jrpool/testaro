/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or   https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  title
  This test reports the page title.
*/

// Runs the test and returns the result.
exports.reporter = async page => {
  const title = await page.title();
  return {
    data: {
      success: true,
      title
    },
    totals: [],
    standardInstances: []
  };
};
