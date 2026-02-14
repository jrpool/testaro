/*
  © 2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  wax
  This test implements the WallyAX WAX Dev Testing Framework ruleset.
*/

// IMPORTS

// Module to process XPaths.
const {getAttributeXPath, getXPathCatalogIndex} = require('../procs/xPath');
// Modules to run WAX.
const runWax = require('@wally-ax/wax-dev');
const waxDev = {runWax};

// FUNCTIONS

// Conducts and reports the WAX tests.
exports.reporter = async (page, report, actIndex) => {
  // Initialize the act report.
  const data = {};
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
  const act = report.acts[actIndex];
  const rules = act.rules || [];
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
        // Populate the native result with it.
        result.nativeResult = actReport;
        // If standard results are to be reported:
        if (standard) {
          const {standardResult} = result;
          const {instances, totals} = standardResult;
          actReport.forEach(violation => {
            const ordinalSeverity = ['Minor', 'Moderate', '', 'Severe'].indexOf(violation.severity);
            // Increment the applicable total of the standard result.
            totals[ordinalSeverity]++;
            // Initialize a standard instance.
            const instance = {
              ruleID: violation.message,
              what: violation.description || violation.message,
              ordinalSeverity,
              count: 1
            };
            const {element} = violation;
            // Get the path ID of the element from its data-xpath attribute.
            const pathID = getAttributeXPath(element);
            // If the acquisition succeeded:
            if (pathID) {
              // Get the catalog index of the element.
              const catalogIndex = getXPathCatalogIndex(report.catalog, pathID);
              // If the acquisition succeeded:
              if (catalogIndex) {
                // Add the catalog index to the standard instance.
                instance.catalogIndex = catalogIndex;
              }
              // Otherwise, i.e. if the acquisition failed:
              else {
                // Add the path ID to the standard instance.
                instance.pathID = pathID;
              }
              // Add the standard instance to the standard result.
              instances.push(instance);
            }
          });
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
  }
  catch(error) {
    const message = `ERROR running WallyAX (${error.message})`;
    data.prevented = true;
    data.error = message;
    console.log(message);
  }
  return {
    data,
    result
  };
};
