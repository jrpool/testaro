/*
  © 2024–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/*
  doTestAct
  Performs the tests of an act.
*/

// IMPORTS

// Module to perform file operations.
const fs = require('fs/promises');
//Modules to close and launch browsers.
const {browserClose, launch} = require(`${__dirname}/../run`);
// Module to set operating-system constants.
const os = require('os');

// CONSTANTS

// Set DEBUG environment variable to 'true' to add debugging features.
const debug = process.env.DEBUG === 'true';
// Set WAITS environment variable to a positive number to insert delays (in ms).
const waits = Number.parseInt(process.env.WAITS) || 0;
const tmpDir = os.tmpdir();

// DEBUGGING

const logMemory = label => {
  const usage = process.memoryUsage();
  console.log(
    `XXX CHILD MEMORY [${label}]: heap ${Math.round(usage.heapUsed / 1024 / 1024)}/${Math.round(usage.heapTotal / 1024 / 1024)}MB, ext ${Math.round(usage.external / 1024 / 1024)}MB, RSS ${Math.round(usage.rss / 1024 / 1024)}MB`
  );
};

// VARIABLES

const actIndex = Number.parseInt(process.argv[2]);

// FUNCTIONS

// Performs the tests of the act specified by the caller.
const doTestAct = async () => {
  const reportPath = `${tmpDir}/report.json`;
  // Get the report from the temporary directory.
  const reportJSON = await fs.readFile(reportPath, 'utf8');
  logMemory('XXX After parsing report');
  const report = JSON.parse(reportJSON);
  // Get a reference to the act in the report.
  const act = report.acts[actIndex];
  // Get the tool name.
  const {which} = act;
  // Launch a browser, navigate to the URL, and update the page export of the run module.
  console.log('XXX About to call launch() in the doTestAct() function');
  await launch(
    report,
    debug,
    waits,
    act.launch && act.launch.browserID || report.browserID,
    act.launch && act.launch.target && act.launch.target.url || report.target.url
  );
  logMemory('XXX After launch');
  // If the launch aborted the job:
  if (report.jobData && report.jobData.aborted) {
    // Close any existing browser.
    await browserClose();
    logMemory('XXX After browser close (aborted)');
    // Save the revised report.
    const reportJSON = JSON.stringify(report);
    logMemory('XXX After report stringified (aborted)');
    await fs.writeFile(reportPath, reportJSON);
    logMemory('XXX After report written (aborted)');
    // Report this.
    process.send('ERROR: Job aborted');
  }
  // Otherwise, i.e. if the launch did not abort the job:
  else {
    // Get the updated page.
    const {page} = require('../run');
    // If it exists:
    if (page) {
      try {
        // Make the act reporter perform the specified tests of the tool.
        const actReport = await require(`../tests/${which}`).reporter(page, report, actIndex, 65);
        logMemory('XXX After act reporter');
        // Add the data and result to the act.
        act.data = actReport.data;
        act.result = actReport.result;
        logMemory('XXX After act data and result assigned');
        // If the tool reported that the page prevented testing:
        if (act.data && act.data.prevented) {
          // Add prevention data to the job data.
          report.jobData.preventions[which] = act.data.error;
        }
        // Close any existing browser.
        await browserClose();
        logMemory('XXX After browser closed');
        console.log('XXX About to stringify the report');
        const reportJSON = JSON.stringify(report);
        logMemory('XXX After report stringified');
        console.log(`XXX JSON report size: ${Math.round(reportJSON.length / 1024 / 1024)}MB`);
        // Save the revised report.
        await fs.writeFile(reportPath, reportJSON);
        logMemory('XXX After report written');
        // Send a completion message.
        process.send('Act completed');
      }
      // If the tool invocation failed:
      catch(error) {
        logMemory('XXX In catch block');
        // Close any existing browser.
        await browserClose();
        // Save the revised report.
        const reportJSON = JSON.stringify(report);
        await fs.writeFile(reportPath, reportJSON);
        // Report the failure.
        const message = error.message.slice(0, 400);
        console.log(`ERROR: Test act ${act.which} failed (${message})`);
        process.send('ERROR performing the act');
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
      process.send(message);
    }
  }
};

doTestAct();
