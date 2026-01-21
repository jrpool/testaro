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
const {Playwright} = require('@siteimprove/alfa-playwright');

// FUNCTIONS

// Simplifies the spacing of a string.
const tidy = string => string.replace(/\s+/g, ' ');

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
    // Get the evaluation.
    const evaluation = Array.from(await audit.evaluate());
    // For each of its components:
    for (const index in evaluation) {
      const component = evaluation[index];
      const targetClass = component.target;
      // If it has a non-collection target:
      if (targetClass && ! targetClass._members) {
        // Get the path, less any final text() selector, and code lines of the target.
        const path = targetClass.path().replace(/\/text\(\).*$/, '');
        const codeLines = targetClass.toString().split('\n');
        // Convert the component to a finding object.
        const finding = component.toJSON();
        const {expectations, outcome, rule} = finding;
        // If the outcome of the finding is a failure or warning:
        if (outcome !== 'passed') {
          let text = '';
          // Get a locator for the target.
          const targetLoc = page.locator(`xpath=${path}`);
          try {
            // Get the inner text of the target.
            text = await targetLoc.innerText({timeout: 100});
          }
          catch(error) {
            console.log(`ERROR: Inner text of target ${path} not found (${error})`);
          }
          const {tags, uri, requirements} = rule;
          const ruleID = uri.replace(/^.+-/, '');
          let ruleSummary = tidy(expectations?.[0]?.[1]?.error?.message || '');
          const {target} = finding;
          const {name, type} = target;
          if (codeLines[0] === '#document') {
            codeLines.splice(2, codeLines.length - 3, '...');
          }
          else if (codeLines[0].startsWith('<html')) {
            codeLines.splice(1, codeLines.length - 2, '...');
          }
          // Get data on the finding.
          const findingData = {
            index,
            outcome,
            rule: {
              ruleID,
              ruleSummary,
              scope: '',
              uri,
              requirements
            },
            target: {
              type,
              tagName: name || path.replace(/^.*\//, '').replace(/\[.*$/, '') || '',
              path,
              codeLines: codeLines.map(
                line => line.length > 300 ? `${line.slice(0, 300)}...` : line
              ),
              text
            }
          };
          // If the rule summary is missing:
          if (findingData.rule.ruleSummary === '') {
            // If a first requirement title exists:
            const {requirements} = findingData.rule;
            if (requirements && requirements.length && requirements[0].title) {
              // Make it the rule summary.
              outcomeData.rule.ruleSummary = requirements[0].title;
            }
          }
          const etcTags = [];
          tags.forEach(tag => {
            if (tag.type === 'scope') {
              findingData.rule.scope = tag.scope;
            }
            else {
              etcTags.push(tag);
            }
          });
          if (etcTags.length) {
            findingData.etcTags = etcTags;
          }
          if (findingData.outcome === 'failed') {
            result.totals.failures++;
          }
          else if (findingData.outcome === 'cantTell') {
            result.totals.warnings++;
          }
          result.items.push(findingData);
        }
      }
    };
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
