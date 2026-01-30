/*
  © 2024–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  doActs
  Performs the tests of an act.
  This file is designed to be run as a child process.
*/

// IMPORTS

// Module to perform file operations.
const fs = require('fs/promises');
//Modules to close and launch browsers.
const {browserClose, launch} = require(`${__dirname}/../run`);
// Module to set operating-system constants.
const os = require('os');

// FUNCTIONS

// Sends a message to the parent process.
const sendMessage = message => {
  try {
    if (typeof process.send === 'function') {
      process.send(message);
    }
  }
  catch(error) {
    console.log(
      `ERROR: process.send threw ${error.message} trying to send message ${message} to parent`
    );
  }
};
// Performs the tests of an act.
const doTestAct = async (reportPath, actIndex) => {
  // Get the report from the temporary directory.
  const reportJSON = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(reportJSON);
  // Get a reference to the act in the report.
  const act = report.acts[actIndex];
  // Get the tool name.
  const {which} = act;
  let page;
  // If the tool is not Testaro:
  if (which !== 'testaro') {
    const browserID = act.launch && act.launch.browserID || report.browserID;
    const targetURL = act.launch && act.launch.target && act.launch.target.url || report.target.url;
    // Launch a browser, navigate to the URL, and update the run-module page export.
    await launch(
      report,
      actIndex,
      'high',
      browserID,
      targetURL
    );
    // If the launch aborted the job:
    if (report.jobData && report.jobData.aborted) {
      // Close any existing browser.
      await browserClose();
      // Save the revised report.
      const reportJSON = JSON.stringify(report);
      await fs.writeFile(reportPath, reportJSON);
      // Report this.
      sendMessage({
        status: 'error',
        error: 'Page launch aborted'
      });
      process.exit(1);
    }
    // Otherwise, i.e. if the launch did not abort the job:
    else {
      // Get the updated page.
      page = require('../run').page;
    }
  }
  // If the page exists or the tool is Testaro:
  if (page || which === 'testaro') {
    try {
      // Make the act reporter perform the specified tests of the tool.
      const actReport = await require(`../tests/${which}`).reporter(page, report, actIndex, 65);
      // Add the data and result to the act.
      act.data = actReport.data;
      act.result = actReport.result;
      // If the tool reported that the page prevented testing:
      if (act.data && act.data.prevented) {
        // Add prevention data to the job data.
        report.jobData.preventions[which] = act.data.error;
      }
      // Close any existing browser.
      await browserClose();
      const reportJSON = JSON.stringify(report);
      // Save the revised report.
      await fs.writeFile(reportPath, reportJSON);
      // Send a completion message.
      sendMessage({
        status: 'ok',
      });
      process.exit(0);
    }
    // If the tool invocation failed:
    catch(error) {
      // Close any existing browser.
      await browserClose();
      // Save the revised report.
      const reportJSON = JSON.stringify(report);
      await fs.writeFile(reportPath, reportJSON);
      // Report the failure.
      const message = error.message.slice(0, 400);
      console.log(`ERROR: Test act ${act.which} failed (${message})`);
      sendMessage({
        status: 'error',
        error: 'ERROR performing the act'
      });
      process.exit(1);
    };
  }
  // Otherwise, i.e. if the page does not exist:
  else {
    // Add data to the act.
    act.data ??= {};
    act.data.prevented = true;
    act.data.error = 'No page';
    // Add prevention data to the job data.
    report.jobData.preventions[which] = act.data.error;
    // Close any existing browser.
    await browserClose();
    const reportJSON = JSON.stringify(report);
    // Save the revised report.
    await fs.writeFile(reportPath, reportJSON);
    // Report this.
    const message = 'ERROR: No page';
    console.log(message);
    sendMessage({
      status: 'error',
      error: message
    });
    process.exit(1);
  }
};

process.on('uncaughtException', error => {
  console.log(`ERROR: uncaughtException (${error.message})`);
  sendMessage({
    status: 'error',
    error: 'uncaughtException'
  });
  process.exit(1);
});

process.on('unhandledRejection', error => {
  const message = error && error.message ? error.message : String(error);
  console.log(`ERROR: unhandledRejection (${message})`);
  sendMessage({
    status: 'error',
    error: 'unhandledRejection'
  });
  process.exit(1);
});

const args = process.argv;
// Perform the specified test act.
doTestAct(args[2], Number.parseInt(args[3]));
