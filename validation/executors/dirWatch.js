/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  dirWatch.js
  Validator for directory watching.
*/

// IMPORTS

const fs = require('fs/promises');

// CONSTANTS

// Override dirWatch environment variables with validation-specific ones.
process.env.JOBDIR = `${__dirname}/../watch`;
process.env.REPORTDIR = `${__dirname}/../../temp`;
const jobID = '240101T1200-simple-example';
const {dirWatch} = require('../../dirWatch');

// Start checking for jobs every 5 seconds.
dirWatch(false, 5)
.then(() => {
  console.log('Success: Watch validation ended');
});
// Make a job available after 7 seconds.
setTimeout(() => {
  fs.copyFile(
    `${__dirname}/../jobs/todo/${jobID}.json`, `${process.env.JOBDIR}/todo/${jobID}.json`
  );
  console.log('Job made available after 7 seconds');
}, 7000);
