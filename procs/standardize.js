/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  standardize.js
  Converts test results to the standard format.
*/

// FUNCTIONS

// Populates the initialized standard result of an act with the act data and result.
const convert = (data, result) => {
  // If the act data state that the act was prevented:
  if (data.prevented) {
    // Add that to the standard result and disregard tool-specific conversions.
    result.standardResult.prevented = true;
  }
  // Round the totals of the standard result.
  result.standardResult.totals = result.standardResult.totals.map(total => Math.round(total));
};
// Populates the initialized standard result of an act.
exports.standardize = act => {
  const {which, data, result} = act;
  if (which && result?.standardResult) {
    convert(data, result);
  }
  else {
    console.log(`ERROR: Result of incomplete ${which || 'unknown'} act cannot be standardized`);
  }
};
