/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  validateTest.js
  Validator for one Testaro test.
*/

// IMPORTS

// Module to process files.
const fs = require('fs').promises;
// Module to run Testaro jobs.
const {doJob} = require('../run');

// CONSTANTS
const job = {
  id: '250101T0000-aaa-00',
  what: '',
  strict: true,
  standard: 'only',
  observe: false,
  device: {
    id: 'default',
    windowOptions: {
      reducedMotion: 'no-preference'
    }
  },
  browserID: 'webkit',
  timeLimit: 0,
  creationTimeStamp: '250101T0000',
  executionTimeStamp: '250101T0000',
  sendReportTo: '',
  target: {
    what: 'page for test validation',
    url: 'file://validation/tests/targets/adbID/index.html'
  },
  sources: {
    script: 'test',
    batch: 'test',
    mergeID: 'aaa',
    requester: ''
  },
  acts: []
};

// FUNCTIONS

// Validates a Testaro test.
exports.validateTest = async testID => {
  // Get data for a job for the test.
  const jobProperties = require(`./tests/jobProperties/${testID}.json`);
  // Use the data to complete the job.
  if (jobProperties.standard) {
    job.standard = jobProperties.standard;
  }
  job.what = `validate Testaro test ${jobProperties.rule}`;
  job.timeLimit = jobProperties.timeLimit;
  job.acts = jobProperties.acts;
  // Perform it.
  report = await doJob(job);
  // Report whether the end time was reported.
  const {acts, jobData} = report;
  if (jobData.endTime && /^(?:\d{2}-){2}\d{2}T\d{2}:\d{2}$/.test(jobData.endTime)) {
    console.log('Success: End time has been correctly populated');
  }
  else {
    console.log('Failure: End time empty or invalid');
  }
  // If the test acts were correctly reported:
  const testActs = acts.filter(act => act.type && act.type === 'test');
  if (
    testActs.length === report.acts.filter(act => act.type === 'test').length
    && testActs.every(
      testAct => testAct.expectationFailures !== undefined
    )
  ) {
    // Report this.
    console.log('Success: Reports have been correctly populated');
    // If all expectations were satisfied:
    if (testActs.every(testAct => testAct.expectationFailures === 0)) {
      // Report this.
      console.log('######## Success: No failures\n');
    }
    // Otherwise, i.e. if not all expectations were satisfied:
    else {
      // Report this.
      console.log(
        '######## Failure: The test has at least one failure (see “"passed": false” below)\n'
      );
      // Output the acts that had failures.
      console.log(
        JSON.stringify(
          acts.filter(act => act.type === 'test' && act.expectationFailures), null, 2
        )
      );
    }
  }
  else {
    console.log('Failure: Act results empty or invalid');
    console.log(JSON.stringify(acts, null, 2));
  }
};
