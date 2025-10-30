/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
  aslint
  This test implements the ASLint ruleset for accessibility.
*/

// IMPORTS

// Module to handle files.
const fs = require('fs/promises');

// FUNCTIONS

// Conducts and reports the ASLint tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
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
    // Populate the act report.
    result = JSON.parse(actReport);
    // If any rules were reported violated:
    if (result.rules) {
      // For each such rule:
      Object.keys(result.rules).forEach(ruleID => {
        // If the rule was passed or skipped or rules to be tested were specified and exclude it:
        const excluded = act.rules && ! act.rules.includes(ruleID);
        const instanceType = result.rules[ruleID].status.type;
        // If rules to be tested were specified and exclude it or the rule was passed or skipped:
        if (excluded || ['passed', 'skipped'].includes(instanceType)) {
          // Delete the rule report.
          delete result.rules[ruleID];
        }
      });
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
