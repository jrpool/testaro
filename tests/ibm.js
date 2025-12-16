/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  ibm
  This test implements the IBM Equal Access ruleset for accessibility.
  The 'withNewContent' argument determines whether the test package should be
  given the URL of the page to be tested (true) or the page content (false).

  This test depends on aceconfig.js.

  This tool is compatible with Windows only if the accessibility-checker package
  is revised. See README.md for details.
*/

// IMPORTS

const fs = require('fs').promises;
// Scanner. Importing and executing 'close' crashed the Node process.
const accessibilityChecker = require('accessibility-checker');
const {getCompliance} = accessibilityChecker;

// FUNCTIONS

// Runs the IBM test and returns the result.
const run = async (content, timeLimit) => {
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
const trimActReport = (data, actReport, withItems, rules) => {
  // If the act report includes a summary:
  if (actReport && actReport.summary) {
    // Remove excluded rules from the act report.
    limitRuleTotals(actReport, rules);
    // If the act report includes totals:
    const totals = actReport.summary.counts;
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
      // Report this.
      const error = 'ERROR: No totals reported';
      console.log(error);
      data.prevented = true;
      data.error = error;
      // Return an empty act report.
      return {
        totals: {},
        items: []
      };
    }
  }
  // Otherwise, i.e. if it excludes a summary:
  else {
    // Report this.
    const error = 'ERROR: No summary reported';
    console.log(error);
    data.prevented = true;
    data.error = error;
    // Return an empty act report.
    return {
      totals: {},
      items: []
    };
  }
};
// Performs the IBM tests and returns an act report.
const doTest = async (content, withItems, timeLimit, rules) => {
  // Conduct the tests.
  const data = {};
  try {
    const runReport = await run(content, timeLimit);
    // If there were results:
    if (runReport.report) {
      // Return a trimmed act report.
      const {report} = runReport;
      const trimmedReport = trimActReport(data, report, withItems, rules);
      return {
        data,
        result: trimmedReport
      };
    }
    // Otherwise, i.e. if there were no results:
    else {
      // Return this.
      return {
        data: runReport,
        result: {}
      }
    }
  }
  catch(error) {
    const message = `Act failed (${error.message.slice(0, 200)})`;
    console.log(message);
    data.prevented = true;
    data.error = message;
    return {
      data,
      result: {}
    };
  }
};
// Conducts and reports the IBM Equal Access tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
  const act = report.acts[actIndex];
  const {withItems, withNewContent, rules} = act;
  const contentType = withNewContent ? 'new' : 'existing';
  try {
    const typeContent = contentType === 'existing' ? await page.content() : page.url();
    // Perform the tests.
    const actReport = await doTest(typeContent, withItems, timeLimit, rules);
    // If the testing was finished on time:
    if (actReport !== 'timedOut') {
      const {data, result} = actReport;
      // If the act was prevented:
      if (data && data.prevented) {
        // Report this.
        const message = 'ERROR: Act was prevented';
        data.error ??= message;
        // Return the failure.
        return {
          data,
          result: {}
        };
      }
      // Otherwise, i.e. if the act was not prevented:
      else {
        // Return the result.
        return {
          data,
          result
        };
      }
    }
    // Otherwise, i.e. if the testing timed out:
    else {
      // Report this.
      return {
        data: {
          prevented: true,
          error: message
        },
        result: {}
      };
    }
  }
  catch(error) {
    const message = `Act crashed (${error.message.slice(0, 200)})`;
    console.log(`ERROR: ${message}`);
    return {
      data: {
        prevented: true,
        error: message
      },
      result: {}
    };
  }
};
