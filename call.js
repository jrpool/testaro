/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  call
  Invokes Testaro modules.
  This is the universal module for use of Testaro from a command line.
  Arguments:
    0. function to execute.
    1+. arguments to pass to the function.
  Usage examples:
    node call run ts99
    node call dirWatch true 30
*/

// IMPORTS

// Module to keep secrets.
require('dotenv').config();
// Module to process files.
const fs = require('fs/promises');
// Function to process a testing request.
const {doJob} = require('./run');
// Function to watch for jobs.
const {dirWatch} = require('./dirWatch');
const {netWatch} = require('./netWatch');

// CONSTANTS

const fn = process.argv[2];
const fnArgs = process.argv.slice(3);
const jobDir = process.env.JOBDIR;
const todoDir = `${jobDir}/todo`;
const reportDir = process.env.REPORTDIR;
const rawDir = `${reportDir}/raw`;

// FUNCTIONS

// Fulfills a testing request.
const callRun = async jobIDStart => {
  // Find the job.
  const jobDirFileNames = await fs.readdir(todoDir);
  const jobFileNames = jobDirFileNames.filter(fileName => fileName.endsWith('.json'));
  const specifiedJobFileNames = jobIDStart
  ? jobFileNames.filter(fileName => fileName.startsWith(jobIDStart))
  : jobFileNames;
  const jobFileName = specifiedJobFileNames[0];
  // If it exists:
  if (jobFileName) {
    // Get it.
    const jobJSON = await fs.readFile(`${todoDir}/${jobFileName}`, 'utf8');
    let report = JSON.parse(jobJSON);
    // Ensure it does not specify server properties.
    report.observe = false;
    // Run it.
    report = await doJob(report);
    // Archive it.
    await fs.rename(`${todoDir}/${jobFileName}`, `${jobDir}/done/${jobFileName}`);
    // Save the report.
    await fs.writeFile(`${rawDir}/${jobFileName}`, JSON.stringify(report, null, 2));
    console.log(`Job completed and report ${report.id}.json saved in ${rawDir}`);
  }
  // Otherwise, i.e. if the job does not exist.
  else {
    // Report the error.
    console.log('ERROR: Specified job does not exist');
  }
};
// Starts a directory watch, converting the interval argument to a number.
const callDirWatch = async (isForever, intervalInSeconds) => {
  await dirWatch(isForever === 'true', Math.max(5, Number.parseInt(intervalInSeconds, 10)));
};
// Starts a network watch, converting the interval argument to a number.
const callNetWatch = async (isForever, intervalInSeconds, isCertTolerant) => {
  await netWatch(
    isForever === 'true',
    Number.parseInt(intervalInSeconds, 10),
    isCertTolerant ? isCertTolerant === 'true' : undefined
  );
};

// OPERATION

// Execute the requested function.
if (fn === 'run' && fnArgs.length < 2) {
  callRun(fnArgs[0])
  .then(() => {
    console.log('Execution completed\n');
    process.exit(0);
  });
}
else if (fn === 'dirWatch' && fnArgs.length === 2) {
  callDirWatch(... fnArgs)
  .then(() => {
    console.log('Directory watch ended');
    process.exit(0);
  });
}
else if (fn === 'netWatch' && [2, 3].includes(fnArgs.length)) {
  callNetWatch(... fnArgs)
  .then(() => {
    console.log('Network watch ended');
    process.exit(0);
  });
}
else {
  console.log('ERROR: Invalid statement');
  process.exit(1);
}
