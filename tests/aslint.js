/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  aslint
  This test implements the ASLint ruleset for accessibility.
*/

// IMPORTS

// Function to add unique identifiers to the elements in the page.
const {addTestaroIDs} = require('../procs/testaro');
// Module to handle files.
const fs = require('fs/promises');
// Function to get location data from an element.
const {getLocationData} = require('../procs/getLocatorData');

// FUNCTIONS

// Conducts and reports the ASLint tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
  // Add unique identifiers to the elements in the page.
  await addTestaroIDs(page);
  // Initialize the act report.
  let data = {};
  let result = {};
  // Get the ASLint runner and bundle scripts.
  const aslintRunner = await fs.readFile(`${__dirname}/../procs/aslint.js`, 'utf8');
  const aslintBundlePath = require.resolve('aslint-testaro/aslint.bundle.js');
  const aslintBundle = await fs.readFile(aslintBundlePath, 'utf8');
  // Get the nonce, if any.
  const act = report.acts[actIndex];
  const {jobData} = report;
  const scriptNonce = jobData && jobData.lastScriptNonce;
  // Inject the ASLint bundle and runner into the head of the page.
  await page.evaluate(args => {
    const {scriptNonce, aslintBundle, aslintRunner} = args;
    // Bundle.
    const bundleEl = document.createElement('script');
    bundleEl.id = 'aslintBundle';
    if (scriptNonce) {
      bundleEl.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to bundle`);
    }
    bundleEl.textContent = aslintBundle;
    document.head.insertAdjacentElement('beforeend', bundleEl);
    // Runner.
    const runnerEl = document.createElement('script');
    if (scriptNonce) {
      runnerEl.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to runner`);
    }
    runnerEl.textContent = aslintRunner;
    document.body.insertAdjacentElement('beforeend', runnerEl);
  }, {scriptNonce, aslintBundle, aslintRunner})
  .catch(error => {
    const message = `ERROR: ASLint injection failed (${error.message.slice(0, 400)})`;
    console.log(message);
    data.prevented = true;
    data.error = message;
  });
  const reportLoc = page.locator('#aslintResult');
  // If the injection succeeded:
  if (! data.prevented) {
    try {
      // Wait for the test results to be attached to the page.
      const waitOptions = {
        state: 'attached',
        timeout: 1000 * timeLimit
      };
      await reportLoc.waitFor(waitOptions);
    }
    catch(error) {
      const message = 'Attachment of test results to page failed';
      console.log(message);
      data.prevented = true;
      data.error = `${message} (${error.message})`;
    };
  }
  // If the injection and the result attachment both succeeded:
  if (! data.prevented) {
    // Get their text.
    const actReport = await reportLoc.textContent();
    result = JSON.parse(actReport);
    // If any rules were reported violated:
    if (result.rules) {
      // For each such rule:
      for (const ruleID of Object.keys(result.rules)) {
        const excluded = act.rules && ! act.rules.includes(ruleID);
        const instanceType = result.rules[ruleID].status.type;
        // If rules to be tested were specified and exclude it or the rule was passed or skipped:
        if (excluded || ['passed', 'skipped'].includes(instanceType)) {
          // Delete the rule report.
          delete result.rules[ruleID];
        }
        // Otherwise, i.e. if the rule was violated:
        else {
          const ruleResults = result.rules[ruleID].results;
          // For each violation:
          for (const ruleResult of ruleResults) {
            const excerpt = ruleResult.element
            && ruleResult.element.html.replace(/\s+/g, ' ')
            || '';
            // If an element excerpt was reported:
            if (excerpt) {
              // Use it to add location data to the violation data in the result.
              ruleResult.locationData = await getLocationData(page, excerpt);
            }
          };
        }
      };
    }
  }
  // Return the act report.
  try {
    JSON.stringify(data);
  }
  catch(error) {
    const message = `ERROR: ASLint result cannot be made JSON (${error.message.slice(0, 200)})`;
    data = {
      prevented: true,
      error: message
    };
  };
  return {
    data,
    result
  };
};
