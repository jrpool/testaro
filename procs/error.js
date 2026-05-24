/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  error.js
  Handles errors.
*/

// IMPORTS

const {nowString} = require('./dateTime');

// FUNCTIONS

// Reports a job being aborted.
const abortActs = (report, actIndex, message = '') => {
  // Add data on the aborted act to the report.
  report.jobData.abortTime = nowString();
  report.jobData.abortedAct = actIndex ?? 'none';
  report.jobData.aborted = true;
  report.jobData.abortMessage = message;
  const abortedActString = typeof actIndex === 'number' ? ` on act ${actIndex}` : '';
  // Log that the job is aborted.
  console.log(`ERROR: Job aborted${abortedActString}`);
};
// Adds an error result to an act.
exports.addError = (alsoLog, alsoAbort, report, actIndex, message) => {
  // If the error is to be logged:
  if (alsoLog) {
    // Log it.
    console.log(message);
  }
  const act = report.acts[actIndex ?? -1];
  // If an act was specified:
  if (act) {
    // Add error data to the result.
    act.result ??= {};
    act.result.success ??= false;
    act.result.error ??= message;
    // If the act is a test act:
    if (act.type === 'test') {
      act.data ??= {};
      // Add prevention data to the act data.
      act.data.prevented = true;
      act.data.error = message;
      // Add prevention data to the job data.
      report.jobData.preventions[act.which] = message;
    }
  };
  // If the job is to be aborted:
  if (alsoAbort) {
    // Add this to the report.
    abortActs(report, actIndex, message);
  }
};
