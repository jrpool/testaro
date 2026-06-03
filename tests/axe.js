/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  axe
  This test implements the axe-core ruleset for accessibility.

  The rules argument defaults to all rules; otherwise, specify an array of rule names.

  The detailLevel argument specifies how many result categories are to be included in the
  details. 0 = none; 1 = violations; 2 = violations and incomplete; 3 = violations, incomplete,
  and passes; 4 = violations, incomplete, passes, and inapplicable. Regardless of the value of this
  argument, Axe-core is instructed to report all nodes with violation or incomplete results, but
  only 1 node per rule found to be passed or inapplicable. Therefore, from the results of this test
  it is possible to count the rules passed and the inapplicable rules, but not the nodes for which
  each rule is passed or inapplicable. To count those nodes, one would need to revise the
  'resultTypes' property of the 'axeOptions' object.

  The report of this test shows rule totals by result category and, within the violation and
  incomplete categories, node totals by severity. It does not show rule or node totals by test
  category (“tag”), such as 'wcag21aaa'. Scoring can consider test categories by getting the value
  of the 'tags' property of each rule.
*/

// IMPORTS

const axePlaywright = require('axe-playwright');
const {getAttributeXPath, getXPathCatalogIndex} = require('../procs/xPath');

// CONSTANTS

const {injectAxe} = axePlaywright;
const severityWeights = {
  minor: 0,
  moderate: 0,
  serious: 1,
  critical: 1
};

// FUNCTIONS

// Conducts and reports the Axe tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {detailLevel, rules} = act;
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
  const {nativeResult, standardResult} = result;
  // Inject axe-core into the page.
  await injectAxe(page)
  .catch(error => {
    console.log(`ERROR: Axe injection failed (${error.message})`);
    data.prevented = true;
    data.error = 'ERROR: axe injection failed';
  });
  // If the injection succeeded:
  if (! data.prevented) {
    // Get the data on the elements violating the specified axe-core rules.
    const axeOptions = {
      resultTypes: ['violations', 'incomplete']
    };
    if (rules && rules.length) {
      axeOptions.runOnly = rules;
    }
    else {
      axeOptions.runOnly = ['experimental', 'best-practice', 'wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'];
    }
    const axeReport = await axePlaywright.getAxeResults(page, null, axeOptions);
    const {inapplicable, passes, incomplete, violations} = axeReport;
    // If the test succeeded:
    if (violations) {
      // Initialize the native result.
      nativeResult.totals = {
        rulesNA: 0,
        rulesPassed: 0,
        rulesWarned: 0,
        rulesViolated: 0,
        warnings: {
          minor: 0,
          moderate: 0,
          serious: 0,
          critical: 0
        },
        violations: {
          minor: 0,
          moderate: 0,
          serious: 0,
          critical: 0
        }
      };
      nativeResult.details = axeReport;
      // Populate the native-result totals.
      const {totals} = nativeResult;
      totals.rulesNA = inapplicable.length;
      totals.rulesPassed = passes.length;
      incomplete.forEach(rule => {
        totals.rulesWarned++;
        rule.nodes.forEach(node => {
          totals.warnings[node.impact]++;
        });
      });
      violations.forEach(rule => {
        totals.rulesViolated++;
        rule.nodes.forEach(node => {
          totals.violations[node.impact]++;
        });
      });
      // Delete irrelevant properties from the report details.
      const irrelevants = ['inapplicable', 'passes', 'incomplete', 'violations']
      .slice(0, 4 - detailLevel);
      irrelevants.forEach(irrelevant => {
        delete axeReport[irrelevant];
      });
      // If standard results are to be reported and there are any suspicions:
      if (standard && (totals.rulesViolated || totals.rulesWarned)) {
        // Resolve each suspected element's FULL data-xpath from the live DOM,
        // keyed by its axe target. axe-core truncates node.html (~300 chars,
        // appends '...'), so parsing data-xpath out of node.html yields a
        // truncated XPath for elements with long attribute lists. node.target
        // is a reliable CSS selector; read the injected data-xpath directly off
        // the element instead. Falls back to the node.html parse on any failure.
        const fullXPathByTargetKey = {};
        try {
          const suspectNodes = ['incomplete', 'violations']
          .filter(certainty => nativeResult?.details?.[certainty])
          .flatMap(certainty => nativeResult.details[certainty].flatMap(rule => rule.nodes));
          const targets = suspectNodes.map(node => node.target);
          const resolvedXPaths = await page.evaluate(targetList => targetList.map(target => {
            try {
              // axe target is an array of selectors (nested arrays for frames/
              // shadow roots). Use the deepest plain-string selector for the
              // common, non-framed case; skip otherwise.
              const selector = Array.isArray(target)
                ? (typeof target[target.length - 1] === 'string' ? target[target.length - 1] : null)
                : (typeof target === 'string' ? target : null);
              if (! selector) {
                return null;
              }
              const element = document.querySelector(selector);
              return element ? element.getAttribute('data-xpath') : null;
            }
            catch(error) {
              return null;
            }
          }), targets);
          suspectNodes.forEach((node, index) => {
            if (resolvedXPaths[index]) {
              fullXPathByTargetKey[JSON.stringify(node.target)] = resolvedXPaths[index];
            }
          });
        }
        catch(error) {
          // Leave the map empty; every instance falls back to node.html below.
        }
        // For each certainty type:
        ['incomplete', 'violations'].forEach(certainty => {
          // If there are any suspicions of this type:
          if (nativeResult?.details?.[certainty]) {
            // For each rule with any suspicions:
            nativeResult.details[certainty].forEach(rule => {
              // For each element suspected of violating the rule:
              rule.nodes.forEach(node => {
                // Get descriptions of the rule.
                const whatSet = new Set([
                  rule.help,
                  ... node.any.map(anyItem => anyItem.message),
                  ... node.all.map(allItem => allItem.message)
                ]);
                // Get the ordinal severity of the suspicion.
                const ordinalSeverity = severityWeights[node.impact]
                + (certainty === 'violations' ? 2 : 0);
                // Increment the standard total.
                standardResult.totals[ordinalSeverity]++;
                // Get the XPath of the suspected element from its data-xpath
                // attribute. Prefer the full value resolved from the live DOM
                // (above); fall back to parsing it out of axe's node.html,
                // which axe truncates and can corrupt the XPath.
                const xPath = fullXPathByTargetKey[JSON.stringify(node.target)]
                || getAttributeXPath(node.html);
                const instance = {
                  ruleID: rule.id,
                  what: Array.from(whatSet.values()).join('; '),
                  ordinalSeverity,
                  count: 1,
                  catalogIndex: getXPathCatalogIndex(report.catalog, xPath)
                };
                standardResult.instances.push(instance);
              });
            });
          }
        });
      }
    }
    // Otherwise, i.e. if the test failed:
    else {
      // Report this.
      data.prevented = true;
      data.error = 'ERROR: Act failed';
      if (standard) {
        standardResult.prevented = true;
      }
    }
  }
  // Return the result.
  try {
    JSON.stringify(data);
  }
  catch(error) {
    const message = `ERROR: Axe result cannot be made JSON (${error.message})`;
    console.log(message);
    data = {
      prevented: true,
      error: message
    };
  }
  return {
    data,
    result
  };
};
