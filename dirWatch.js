/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  dirWatch.js
  Module for watching a directory for jobs.
*/

// ########## IMPORTS

// Module to keep secrets.
require('dotenv').config();
// Module to read and write files.
const fs = require('fs/promises');
// Module to perform jobs.
const {doJob} = require('./run');
// Module to get dates from time stamps.
const {dateOf, nowString} = require('./procs/dateTime');

// ########## CONSTANTS

const jobDir = process.env.JOBDIR;
const reportDir = process.env.REPORTDIR;

// ########## FUNCTIONS

// Writes a directory report.
const writeDirReport = async report => {
  const jobID = report && report.id;
  if (jobID) {
    try {
      const reportJSON = JSON.stringify(report, null, 2);
      const reportName = `${jobID}.json`;
      const rawDir = `${reportDir}/raw`;
      await fs.mkdir(rawDir, {recursive: true});
      await fs.writeFile(`${rawDir}/${reportName}`, `${reportJSON}\n`);
      console.log(`Report ${jobID} saved in ${rawDir}`);
    }
    catch(error) {
      console.log(`ERROR: Failed to save report ${jobID} in ${rawDir} (${error.message})`);
    }
  }
  else {
    console.log('ERROR: Job has no ID');
  }
};
// Archives a job.
const archiveJob = async (job, isFile) => {
  // Save the job in the done subdirectory.
  const {id} = job;
  const jobJSON = JSON.stringify(job, null, 2);
  const doneDir = `${jobDir}/done`;
  await fs.mkdir(doneDir, {recursive: true});
  await fs.writeFile(`${doneDir}/${id}.json`, `${jobJSON}\n`);
  // If the job had been saved as a file in the todo subdirectory:
  if (isFile) {
    // Delete the file.
    await fs.rm(`${jobDir}/todo/${id}.json`);
  }
  console.log(`Job ${id} archived in ${doneDir} (${nowString()})`);
};
// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
/*
  Checks for a directory job and, when found, performs and reports it.
  Arguments:
  0. Whether to continue watching after a job is run.
  1: interval in seconds from a no-job check to the next check.
*/
exports.dirWatch = async (isForever, intervalInSeconds) => {
  intervalInSeconds ||= 5;
  intervalInSeconds = Math.max(intervalInSeconds, 5);
  console.log(`Starting to watch directory ${jobDir}/todo for jobs`);
  let notYetRun = true;
  // As long as watching as to continue:
  while (isForever || notYetRun) {
    try {
      // If there are any jobs in the watched directory:
      const toDoFileNames = await fs.readdir(`${jobDir}/todo`);
      const jobFileNames = toDoFileNames.filter(fileName => fileName.endsWith('.json'));
      if (jobFileNames.length) {
        // If the first one is ready to do:
        const firstJobTimeStamp = jobFileNames[0].replace(/-.+$/, '');
        if (Date.now() > dateOf(firstJobTimeStamp)) {
          // Get it.
          const jobJSON = await fs.readFile(`${jobDir}/todo/${jobFileNames[0]}`, 'utf8');
          try {
            const job = JSON.parse(jobJSON);
            let report = JSON.parse(jobJSON);
            // Ensure it has no server properties.
            job.observe = false;
            report.observe = false;
            const {id} = job;
            console.log(`\n\nDirectory job ${id} ready to do (${nowString()})`);
            // Perform it and get a report.
            report = await doJob(report);
            console.log(`Job ${id} finished (${nowString()})`);
            // Save the report.
            await writeDirReport(report);
            // Archive the job.
            await archiveJob(job, true);
          }
          catch(error) {
            console.log(`ERROR processing directory job (${error.message})`);
          }
          notYetRun = false;
        }
        // Otherwise, i.e. if the first one is not yet ready to do:
        else {
          // Report this.
          console.log(`All jobs in ${jobDir} not yet ready to do (${nowString()})`);
          // Wait for the specified interval.
          await wait(1000 * intervalInSeconds);
        }
      }
      // Otherwise, i.e. if there are no jobs in the watched directory:
      else {
        console.log(`No job in ${jobDir} (${nowString()})`);
        // Wait for the specified interval.
        await wait(1000 * intervalInSeconds);
      }
    }
    // If a fatal error was thrown:
    catch(error) {
      // Report this.
      console.log(`ERROR: Directory watching failed (${error.message}); watching aborted`);
      // Quit watching.
      break;
    }
  }
};
