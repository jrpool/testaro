/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
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

// Module to perform acts.
const {doActs} = require('./procs/doActs');
// Module to keep secrets.
require('dotenv').config({quiet: true});
// Function to validate jobs.
const {isValidJob} = require('./procs/job');
// Module to create catalogs.
const {getCatalog} = require('./procs/catalog');
// Module to process dates and times.
const {nowString} = require('./procs/dateTime');
// Module to create browsers.
const {chromium, webkit, firefox} = require('playwright-extra');
// Module to evade automation detection.
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
webkit.use(StealthPlugin());
firefox.use(StealthPlugin());

// FUNCTIONS

// Runs a job and returns a report.
exports.doJob = async (job, opts = {}) => {
  // Make a report as a copy of the job.
  const report = JSON.parse(JSON.stringify(job));
  const jobData = report.jobData = {};
  // Get whether the job is valid and, if not, why not.
  const jobInvalidity = isValidJob(job);
  // If it is invalid:
  if (! jobInvalidity.isValid) {
    // Report this.
    console.log(`ERROR: ${jobInvalidity.error}`);
    jobData.aborted = true;
    jobData.abortedAct = null;
    jobData.abortError = jobInvalidity.error;
  }
  // Otherwise, i.e. if it is valid:
  else {
    // Add initialized job data to the report.
    const startTime = new Date();
    report.jobData = {
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
    if (job.browserID && job.target && ['only', 'also'].includes(job.standard)) {
      // Create a catalog of the target and add it to the report.
      report.catalog = await getCatalog(report);
    }
    // Perform the acts with any specified same-host observation options.
    await doActs(report, opts);
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
