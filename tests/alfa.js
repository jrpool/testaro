/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  alfa
  This test implements the alfa ruleset for accessibility.
*/

// IMPORTS

let alfaRules = require('@siteimprove/alfa-rules').default;
const {Audit} = require('@siteimprove/alfa-act');
const path = require('path');
const {Playwright} = require('@siteimprove/alfa-playwright');

// FUNCTIONS

// Simplifies the spacing of a string.
const tidy = string => string.replace(/\n/g, ' ').replace(/\s+/g, ' ');

// Conducts and reports the alfa tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules} = act;
  // If only some rules are to be employed:
  if (rules && rules.length) {
    // Remove the other rules.
    alfaRules = alfaRules.filter(rule => rules.includes(rule.uri.replace(/^.+-/, '')));
  }
  // Initialize the act report.
  const data = {};
  const result = {
    totals: {
      failures: 0,
      warnings: 0
    },
    items: []
  };
  try {
    // Test the page content with the specified rules.
    const doc = await page.evaluateHandle('document');
    const alfaPage = await Playwright.toPage(doc);
    const audit = Audit.of(alfaPage, alfaRules);
    // Get the test outcomes.
    const outcomes = Array.from(await audit.evaluate());
    // For each outcome:
    outcomes.forEach((outcome, index) => {
      const {target} = outcome;
      // If the target exists and is not a collection:
      if (target && ! target._members) {
        // Convert the outcome to an object.
        const outcomeJ = outcome.toJSON();
        // Get the verdict.
        const verdict = outcomeJ.outcome;
        // If the verdict is a failure or warning:
        if (verdict !== 'passed') {
          // Add to the result.
          const {expectations, rule} = outcomeJ;
          const {tags, uri, requirements} = rule;
          const ruleID = uri.replace(/^.+-/, '');
          let ruleSummary = tidy(expectations?.[0]?.[1]?.error?.message || '');
          const targetJ = outcomeJ.target;
          const codeLines = target.toString().split('\n');
          if (codeLines[0] === '#document') {
            codeLines.splice(2, codeLines.length - 3, '...');
          }
          else if (codeLines[0].startsWith('<html')) {
            codeLines.splice(1, codeLines.length - 2, '...');
          }
          const outcomeData = {
            index,
            verdict,
            rule: {
              ruleID,
              ruleSummary,
              scope: '',
              uri,
              requirements
            },
            target: {
              type: targetJ.type,
              tagName: targetJ.name || '',
              path: target.path(),
              codeLines: codeLines.map(line => line.length > 300 ? `${line.slice(0, 300)}...` : line)
            }
          };
          // If the rule summary is missing:
          if (outcomeData.rule.ruleSummary === '') {
            // If a first requirement title exists:
            const {requirements} = outcomeData.rule;
            if (requirements && requirements.length && requirements[0].title) {
              // Make it the rule summary.
              outcomeData.rule.ruleSummary = requirements[0].title;
            }
          }
          const etcTags = [];
          tags.forEach(tag => {
            if (tag.type === 'scope') {
              outcomeData.rule.scope = tag.scope;
            }
            else {
              etcTags.push(tag);
            }
          });
          if (etcTags.length) {
            outcomeData.etcTags = etcTags;
          }
          if (outcomeData.verdict === 'failed') {
            result.totals.failures++;
          }
          else if (outcomeData.verdict === 'cantTell') {
            result.totals.warnings++;
          }
          result.items.push(outcomeData);
        }
      }
    });
  }
  catch(error) {
    console.log(`ERROR: Navigation to URL timed out (${error})`);
    data.prevented = true;
    data.error = 'ERROR: Act failed';
  }
  return {
    data,
    result
  };
};
