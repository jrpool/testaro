/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jeff Witt.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  run.js
  Testaro main utility module.
*/

// IMPORTS

const {doActs} = require('./procs/doActs');
require('dotenv').config({quiet: true});
const {isValidJob} = require('./procs/job');
const {getCatalog} = require('./procs/catalog');
const {nowString} = require('./procs/dateTime');
const {chromium, webkit, firefox} = require('playwright-extra');
const fs = require('fs').promises;
const os = require('os');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
webkit.use(StealthPlugin());
firefox.use(StealthPlugin());

// FUNCTIONS

// Returns an operating-system-compatible absolute path to a temporary directory.
const getTmpDirPath = async jobName => {
  let jobTmpDir = `${__dirname}/tmp/${jobName}`;
  try {
    // Ensure that a temporary directory exists.
    await fs.mkdir(jobTmpDir, {recursive: true});
  }
  catch (error) {
    console.log(`ERROR: Could not create temporary directory (${error.message})`);
    jobTmpDir = null;
  }
  const tmpDirs = [os.tmpdir(), '/tmp'];
  if (jobTmpDir) {
    tmpDirs.unshift(jobTmpDir);
  }
  let tmpDir = null;
  // For each potential temporary directory:
  for (const tmpDirAlternative of tmpDirs) {
    try {
      // Verify that it is writable.
      await fs.access(tmpDirAlternative, fs.constants.W_OK);
      tmpDir = tmpDirAlternative;
      // If it is, stop checking alternatives.
      break;
    }
    // If it is not:
    catch(error) {
      // Report this and continue checking alternatives.
      console.log(`ERROR: ${tmpDirAlternative} not writable for temporary files`);
    }
  }
  // If no writable temporary directory was found:
  if (! tmpDir) {
    // Report this.
    console.log('ERROR: No writable temporary directory was found');
  }
  // Return the directory path or a failure.
  return tmpDir;
};
// Runs a job and returns a report.
exports.doJob = async (job, opts = {}) => {
  // Initialize a report as a copy of the job.
  let report = JSON.parse(JSON.stringify(job));
  report.jobData ??= {};
  const {jobData} = report;
  // Get whether the job is valid and, if not, why not.
  const jobInvalidity = isValidJob(job);
  // If it is invalid:
  if (! jobInvalidity.isValid) {
    // Report this.
    console.log(`ERROR: ${jobInvalidity.error}`);
    jobData.aborted = true;
    jobData.abortedAct = null;
    jobData.abortMessage = jobInvalidity.error;
  }
  // Otherwise, i.e. if it is valid:
  else {
    // Report this.
    console.log(`Starting job ${job.id} (${job.target.what})`);
    const tmpDir = await getTmpDirPath(job.id);
    // Add initialized job data to the report.
    const startTime = new Date();
    report.jobData = {
      tmpDir,
      startTime: nowString(),
      endTime: '',
      elapsedSeconds: 0,
      visitLatency: 0,
      logCount: 0,
      logSize: 0,
      errorLogCount: 0,
      errorLogSize: 0,
      prohibitedCount: 0,
      visitRejectionCount: 0,
      aborted: false,
      abortedAct: null,
      abortTime: '',
      abortMessage: '',
      presses: 0,
      amountRead: 0,
      toolTimes: {},
      preventions: {}
    };
    process.on('message', message => {
      if (message === 'interrupt') {
        console.log('ERROR: Terminal interrupted the job');
        process.exit();
      }
    });
    // If the job specifies a browser ID and a target and requires standardization:
    if (job.browserID && job.target && job.standard !== 'no') {
      // Create a catalog of the target and add it to the report.
      report.catalog = await getCatalog(report);
    }
    // Perform the acts and revise the report.
    report = await doActs(report, opts);
    // Add the end time and duration to the report.
    const endTime = new Date();
    report.jobData.endTime = nowString();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
    report.jobData.elapsedSeconds =  elapsedSeconds;
    console.log(`Elapsed seconds: ${elapsedSeconds}`);
    // Consolidate and sort the tool times, if any.
    const {toolTimes} = report.jobData;
    const toolTimeData = Object
    .keys(toolTimes)
    .sort((a, b) => toolTimes[b] - toolTimes[a])
    .map(tool => [tool, toolTimes[tool]]);
    report.jobData.toolTimes = {};
    toolTimeData.forEach(item => {
      report.jobData.toolTimes[item[0]] = item[1];
    });
  }
  // Return the report.
  return report;
};
