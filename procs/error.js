/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  error.js
  Handles errors.
*/

// Adds an error result to an act.
exports.addError = (alsoLog, alsoAbort, report, actIndex, message) => {
  // If the error is to be logged:
  if (alsoLog) {
    // Log it.
    console.log(message);
  }
  // Add error data to the result.
  const act = report.acts[actIndex];
  act.result ??= {};
  act.result.success ??= false;
  act.result.error ??= message;
  if (act.type === 'test') {
    act.data ??= {};
    act.data.prevented = true;
    act.data.error = message;
    // Add prevention data to the job data.
    report.jobData.preventions[act.which] = message;
  }
  // If the job is to be aborted:
  if (alsoAbort) {
    // Add this to the report.
    abortActs(report, actIndex);
  }
};
