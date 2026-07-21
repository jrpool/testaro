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
/*
  Module to evade detection of Chromium automation. Injects launch flags
  (e.g., `--disable-blink-features=AutomationControlled`) and patches
  Blink-only DOM globals. Job-level opt-out for Chromium happens in
  procs/launch.js via the `stealth` field.
*/
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

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
  // Fire-and-forget progress emitter (see #44). A handler exception is logged,
  // never propagated, so a faulty consumer can never abort the job. Payloads
  // carry identifiers and timing only — no report content — and are delivered
  // via the existing opts param, so doJob's signature is unchanged.
  const emitProgress = event => {
    if (opts && typeof opts.onProgress === 'function') {
      try {
        opts.onProgress(event);
      }
      catch (error) {
        console.log(`ERROR in onProgress callback: ${error.message}`);
      }
    }
  };
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
    emitProgress({event: 'jobStart', id: job.id});
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
      // Initialize a catalog so it precedes any page images in the report.
      report.catalog = {};
      // getCatalog() navigates to the target (procs/catalog.js) — which, on a
      // slow, blocked, or dead target, can retry across browser types — before
      // any act runs. Bracket it with events so a consumer can heartbeat through
      // this phase instead of seeing the job fall silent until the first act.
      emitProgress({event: 'catalogStart'});
      const catalogStartMs = Date.now();
      // Add a catalog of the target, and a page image if required, to the report.
      report.catalog = await getCatalog(report);
      emitProgress({event: 'catalogEnd', elapsedMs: Date.now() - catalogStartMs});
    }
    // Perform the acts and revise the report.
    report = await doActs(report, opts);
    // Delete the temporary directory.
    await fs.rm(tmpDir, {recursive: true, force: true});
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
  // Signal job completion (also fires for an invalid job, after its abort data
  // is set) so a consumer can finalize regardless of outcome.
  emitProgress({event: 'jobEnd', id: job.id, aborted: !! report.jobData.aborted});
  // Return the report.
  return report;
};
