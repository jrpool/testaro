/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  ibm
  This tool implements the IBM Equal Access ruleset for accessibility. The 'withNewContent' argument determines whether the test package is given the URL of the page to be tested (true) or the page (false).

  This tool depends on aceconfig.js.

  This tool is compatible with Windows only if the accessibility-checker package
  is revised. See README.md for details.
*/

// IMPORTS

// Function to get the index of an element in the catalog.
const {getAttributeXPath, getXPathCatalogIndex} = require('../procs/xpath');
// Scanner. Importing and executing 'close' crashed the Node process.
const accessibilityChecker = require('accessibility-checker');
const {getCompliance} = accessibilityChecker;

// FUNCTIONS

// Runs the IBM test and returns the result.
const run = async content => {
  const nowLabel = (new Date()).toISOString().slice(0, 19);
  try {
    const ibmReport = await getCompliance(content, nowLabel);
    if (typeof ibmReport === 'object' && ibmReport.report) {
      return ibmReport;
    }
    else {
      return {
        prevented: true,
        error: 'ibm getCompliance produced no report'
      };
    }
  }
  catch(error) {
    console.log('ibm getCompliance failed');
    return {
      prevented: true,
      error: error.message.slice(0, 200)
    };
  }
};
// Revises act-report totals for any rule limitation.
const limitRuleTotals = (actReport, rules) => {
  if (rules && Array.isArray(rules) && rules.length) {
    const totals = actReport.summary.counts;
    const items = actReport.results;
    totals.violation = totals.recommendation = 0;
    items.forEach(item => {
      if (rules.includes(item.ruleId)) {
        totals[item.level]++;
      }
    });
  }
};
// Trims an IBM report.
const trimActReport = (actReport, withItems, rules) => {
  // If the act report includes a summary:
  if (actReport && actReport.summary) {
    // Remove excluded rules from the act report.
    limitRuleTotals(actReport, rules);
    const totals = actReport.summary.counts;
    // If the act report includes totals:
    if (totals) {
      // If itemization is required:
      if (withItems) {
        // Trim the items.
        if (rules && Array.isArray(rules) && rules.length) {
          actReport.items = actReport.results.filter(item => rules.includes(item.ruleId));
        }
        else {
          actReport.items = actReport.results;
        }
        actReport.items.forEach(item => {
          delete item.apiArgs;
          delete item.category;
          delete item.ignored;
          delete item.messageArgs;
          delete item.reasonId;
          delete item.ruleTime;
          delete item.value;
        });
      }
      // Return the act report, trimmed.
      return {
        totals,
        items: actReport.items
      };
    }
    // Otherwise, i.e. if it excludes totals:
    else {
      // Return an act report with this error.
      return {
        totals: null,
        items: [],
        error: 'No totals reported'
      };
    }
  }
  // Otherwise, i.e. if it excludes a summary:
  else {
    // Return an act report with this error.
    return {
      totals: null,
      items: [],
      error: 'No summary reported'
    };
  }
};
// Conducts and reports the IBM Equal Access tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {withItems, withNewContent, rules} = act;
  const contentType = withNewContent ? 'new' : 'existing';
  // Initialize the act report.
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
  try {
    const typeContent = contentType === 'existing' ? page : page.url();
    // Conduct the tests.
    const runReport = await run(typeContent);
    const actReport = runReport.report;
    // If there were results:
    if (actReport) {
      // Trim them.
      result.nativeResult = trimActReport(actReport, withItems, rules);
      const {nativeResult, standardResult} = result;
      const {error, totals} = nativeResult;
      // If they were not trimmable:
      if (error) {
        // Return an act report with this error.
        return {
          data: {
            prevented: true,
            error
          },
          result: {}
        }
      }
      // Otherwise, i.e. if they were trimmable, and if standard results are to be reported:
      if (standard) {
        // Populate the totals of the standard result.
        standardResult.totals = [totals.recommendation, 0, totals.violation, 0];
        // For each item of the native result:
        nativeResult.items.forEach(item => {
          // Populate a standard instance.
          const standardItem = {
            ruleID: item.ruleId,
            what: item.message,
            ordinalSeverity: item.level === 'recommendation' ? 0 : 2,
            count: 1
          };
          // Get the XPath from the added attribute, because path.dom is wrong.
          const xPath = getAttributeXPath(item.snippet);
          const catalogIndex = getXPathCatalogIndex(report.catalog, xPath);
          // If a catalog index was found:
          if (catalogIndex) {
            // Add it to the standard instance.
            standardItem.catalogIndex = catalogIndex;
          }
          // Otherwise, if no catalog index was found but the item has an XPath:
          else if (xPath) {
            // Add the XPath to the standard instance.
            standardItem.pathID = xPath;
          }
          // Add the standard instance to the standard result.
          standardResult.instances.push(standardItem);
        });
      }
      return {
        data: {},
        result
      };
    }
    // Otherwise, i.e. if there was only an error, return it in an act report.
    return {
      data: runReport,
      result: {}
    }
  }
  // If an error occurred:
  catch(error) {
    const message = `Act failed (${error.message.slice(0, 200)})`;
    console.log(message);
    // Return it in an act report.
    return {
      data: {
        prevented: true,
        error: message
      },
      result: {}
    };
  }
};
