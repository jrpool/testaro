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

// Module to keep secrets.
require('dotenv').config({quiet: true});
// Module to execute shell commands.
const {execSync} = require('child_process');
// Function to validate jobs.
const {isValidJob} = require('./procs/job');
// Module to process dates and times.
const {nowString} = require('./procs/dateTime');
// Module to evade automation detection.
const {chromium, webkit, firefox} = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
webkit.use(StealthPlugin());
firefox.use(StealthPlugin());

// ########## VARIABLES

// Facts about the current act.
let cleanupInProgress = false;
let browserCloseIntentional = false;

// FUNCTIONS

// Closes any current browser.
const browserClose = exports.browserClose = async () => {
  // If a browser exists:
  if (browser) {
    browserCloseIntentional = true;
    // Try to close all its contexts and ignore any messages that they are already closed.
    for (const context of browser.contexts()) {
      try {
        await context.close();
      }
      catch(error) {
      }
    }
    // Close the browser.
    await browser.close();
    browserCloseIntentional = false;
    browser = null;
  }
};
// Runs a job and returns a report.
exports.doJob = async (job, opts = {}) => {
  // Make a report as a copy of the job.
  const report = JSON.parse(JSON.stringify(job));
  const jobData = report.jobData = {};
  // Get whether the job is valid and, if not, why.
  const jobInvalidity = isValidJob(job);
  // If it is invalid:
  if (jobInvalidity) {
    // Report this.
    console.log(`ERROR: ${jobInvalidity}`);
    jobData.aborted = true;
    jobData.abortedAct = null;
    jobData.abortError = jobInvalidity;
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
    // If the job specifies a target and requires standardization::
    if (job.target && ['only', 'also'].includes(job.standard)) {
      // Add a catalog of the target to the report.
      report.catalog = await getCatalog(report.target);
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

// CLEANUP HANDLERS

// Force-kills any Playwright browser processes synchronously.
const forceKillBrowsers = () => {
  if (cleanupInProgress) {
    return;
  }
  cleanupInProgress = true;
  try {
    // Kill any Chromium headless shell processes.
    execSync('pkill -9 -f "chromium_headless_shell.*headless_shell"', {stdio: 'ignore'});
  }
  catch(error) {}
};
// Force-kills any headless shell processes synchronously on process exit.
process.on('exit', () => {
  forceKillBrowsers();
});
// Force-kills any headless shell processes synchronously on beforeExit.
process.on('beforeExit', async () => {
  if (!browserCloseIntentional) {
    await browserClose();
  }
  forceKillBrowsers();
});
// Force-kills any headless shell processes synchronously on uncaught exceptions.
process.on('uncaughtException', async error => {
  console.error('Uncaught exception:', error);
  await browserClose();
  forceKillBrowsers();
  process.exit(1);
});
// Force-kills any headless shell processes synchronously on SIGINT.
process.on('SIGINT', async () => {
  await browserClose();
  forceKillBrowsers();
  process.exit(0);
});
// Force-kills any headless shell processes synchronously on SIGTERM.
process.on('SIGTERM', async () => {
  await browserClose();
  forceKillBrowsers();
  process.exit(0);
});
