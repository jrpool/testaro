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
  try {
    const typeContent = contentType === 'existing' ? await page.content() : page.url();
    // Conduct the tests.
    const runReport = await run(typeContent);
    const {report} = runReport;
    // If there were results:
    if (report) {
      // Trim them.
      const trimmedReport = trimActReport(report, withItems, rules);
      const {error} = trimmedReport;
      // If the report was not trimmable:
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
      // Otherwise, i.e. if the report was trimmable, return it.
      return {
        data: {},
        result: trimmedReport
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
