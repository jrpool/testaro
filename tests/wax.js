/*
  © 2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  wax
  This test implements the WallyAX WAX Dev Testing Framework ruleset.
*/

// IMPORTS

// Function to add and use unique element IDs.
const {addTestaroIDs} = require('../procs/testaro');
// Function to get location data from an element.
const {getElementData} = require('../procs/getLocatorData');
// Modules to run WAX.
const runWax = require('@wally-ax/wax-dev');
const waxDev = {runWax};

// FUNCTIONS

// Conducts and reports the WAX tests.
exports.reporter = async (page, report, actIndex) => {
  // Initialize the act report.
  let data = {};
  let result = {};
  const act = report.acts[actIndex];
  const rules = act.rules || [];
  // Annotate all elements on the page with unique identifiers.
  await addTestaroIDs(page);
  const pageCode = await page.content();
  const waxOptions = {
    rules,
    apiKey: process.env.WAX_KEY || ''
  };
  try {
    // Run WAX.
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
        // Add location data to its reported violations.
        for (const violation of actReport) {
          const {element} = violation;
          const elementLocation = await getElementData(page, element);
          Object.assign(violation, elementLocation);
        }
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
    // Return the results.
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
