/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  run.js
  Validator for immediate job execution.
*/

// ########## IMPORTS

const fs = require('fs/promises');

// ########## CONSTANTS

const {doJob} = require('../../run');
const jobID = '240101T1200-simple-example';

// ########## OPERATION

// Get the simple job.
fs.readFile(`${__dirname}/../jobs/todo/${jobID}.json`, 'utf8')
.then(async jobJSON => {
  const job = JSON.parse(jobJSON);
  // Run it.
  const report = await doJob(job);
  try {
    // Check the report against expectations.
    const {acts, jobData} = report;
    if (acts.length !== 2) {
      console.log('Failure: Count of acts is not 2');
    }
    else if (! jobData) {
      console.log('Failure: Report omits jobData');
    }
    else if (jobData.endTime < jobData.startTime) {
      console.log('Failure: End time precedes start time');
    }
    else {
      console.log('Success');
    }
  }
  catch(error) {
    console.log(`ERROR: ${error.message}`);
  }
});
