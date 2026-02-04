/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  ed11y
  This test implements the Editoria11y ruleset for accessibility.
*/

// IMPORTS

// Module to handle files.
const fs = require('fs/promises');
// Module to normalize XPaths.
const {getNormalizedXPath} = require('../procs/identify');
// Module to get the XPath of an element.
const {xPath} = require('playwright-dompath');

// FUNCTIONS

// Performs and reports the Editoria11y tests.
exports.reporter = async (page, report, actIndex) => {
  // Get the nonce, if any.
  const act = report.acts[actIndex];
  const {jobData} = report;
  const scriptNonce = jobData && jobData.lastScriptNonce;
  // Initialize the act report.
  let data = {};
  const result = {
    nativeResult: {},
    standardResult: {}
  };
  const standard = report.standard !== 'no';
  // If standard results are to be reported:
  if (standard) {
    // Initialize the standard result.
    result.standardResult = {
      prevented: false,
      totals: [0, 0, 0, 0],
      instances: []
    };
  }
  // Get the tool script.
  const script = await fs.readFile(`${__dirname}/../ed11y/editoria11y.min.js`, 'utf8');
  // Perform the specified tests and get the violating elements and violation facts.
  const nativeResult = await page.evaluate(args => new Promise(async resolve => {
    const {scriptNonce, script, rulesToTest} = args;
    // When the script has been executed, creating data in an Ed11y object:
    document.addEventListener('ed11yResults', () => {
      // Populate the native result with the data.
      const output = Ed11y;
      // Return the native result.
      resolve(output.results);
    });
    // Add the tool script to the page.
    const toolScript = document.createElement('script');
    if (scriptNonce) {
      toolScript.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to tool script`);
    }
    toolScript.textContent = script;
    document.body.insertAdjacentElement('beforeend', toolScript);
    // Execute the tool script, creating Ed11y and triggering the event listener.
    try {
      await new Ed11y({
        alertMode: 'headless'
      });
    }
    catch(error) {
      resolve({
        prevented: true,
        error: error.message
      });
    };
  }), {
    scriptNonce,
    script,
    rulesToTest: act.rules
  });
  result.nativeResult = nativeResult;
  return {
    data,
    result
  };
};
