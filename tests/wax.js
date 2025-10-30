/*
  © 2024 CVS Health and/or one of its affiliates. All rights reserved.
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
  wax
  This test implements the WallyAX WAX Dev Testing Framework ruleset.
*/

// IMPORTS

// WAX
const runWax = require('@wally-ax/wax-dev');
const waxDev = {runWax};

// FUNCTIONS

// Conducts and reports the WAX tests.
exports.reporter = async (page, report, actIndex) => {
  // Initialize the act report.
  let data = {};
  let result = {};
  // Run WAX.
  const act = report.acts[actIndex];
  const rules = act.rules || [];
  const pageCode = await page.content();
  const waxOptions = {
    rules,
    apiKey: process.env.WAX_KEY || ''
  };
  try {
    const actReport = await waxDev.runWax(pageCode, waxOptions);
    // If WAX failed with a string report:
    if (typeof actReport === 'string') {
      // Report this.
      data.prevented = true;
      data.error = actReport;
    }
    // Otherwise, if the report is an array:
    else if (Array.isArray(actReport)) {
      // If it is an error report:
      if (actReport.length === 1 && typeof actReport[0] === 'object' && actReport[0].error) {
        // Report this.
        data.prevented = true;
        const {error} = actReport[0];
        data.error = error;
        console.log(`ERROR running wax: ${error}`);
      }
      // Otherwise, i.e. if it is a successful report:
      else {
        // Populate the act report.
        result = {
          violations: actReport
        }
      }
    }
    // Otherwise, if the report is a non-array object:
    else if (typeof actReport === 'object') {
      // If the response status was a system error:
      if(actReport.responseCode === 500) {
        // Report this.
        data.prevented = true;
        data.error = actReport.message || 'response status code 500';
      }
      // Otherwise, if there was an error:
      else if (actReport.error) {
        // Report this.
        data.prevented = true;
        data.error = actReport.error;
      }
      // In any other case:
      else {
        // Report a prevention.
        data.prevented = true;
        data.error = 'wax failure';
      }
    }
    // Return the results.
    try {
      JSON.stringify(data);
    }
    catch(error) {
      const message = `ERROR: WAX result cannot be made JSON (${error.message.slice(0, 200)})`;
      data = {
        prevented: true,
        error: message
      };
    }
    return {
      data,
      result
    };
  }
  catch(error) {
    const message = `ERROR running WallyAX (${error.message})`;
    data = {
      prevented: true,
      error: message
    };
    console.log(message);
    return {
      data,
      result
    };
  }
};
