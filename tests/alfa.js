/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.

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
  alfa
  This test implements the alfa ruleset for accessibility.
*/

// IMPORTS

const {Audit} = require('@siteimprove/alfa-act');
const {Playwright} = require('@siteimprove/alfa-playwright');
let alfaRules = require('@siteimprove/alfa-rules').default;
const alfaRulesData = require('@siteimprove/alfa-act-r/reports/summary-assisted.md');

// FUNCTIONS

// Returns the identifiers and summaries of the alfa rules.
const getRuleData = () => {
  const ruleData = {};
  const lines = alfaRulesData.split('\n');
  const ruleLines = lines.filter(line => /^| [a-z0-9]{6} |/.test(line));
  const ruleArrays = ruleLines.map(line => line.split(/|/).map(item => item.trim()));
  ruleArrays.forEach(array => {
    ruleData[array[3]] = array[2];
  });
  return ruleData;
};

// Conducts and reports the alfa tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules} = act;
  // If only some rules are to be employed:
  if (rules && rules.length) {
    // Remove the other rules.
    alfaRules = alfaRules.filter(rule => rules.includes(rule.uri.replace(/^.+-/, '')));
  }
  // Open a page for the summaries of the alfa rules.
  const context = page.context();
  const rulePage = await context.newPage();
  rulePage.on('console', msg => {
    const msgText = msg.text();
    console.log(msgText);
  });
  // Initialize the act report.
  const data = {};
  const result = {
    totals: {
      failures: 0,
      warnings: 0
    },
    items: []
  };
  // Get the Alfa rules.
  const ruleData = getRuleData();
  try {
    // Test the page content with the specified rules.
    const doc = await page.evaluateHandle('document');
    const alfaPage = await Playwright.toPage(doc);
    const audit = Audit.of(alfaPage, alfaRules);
    const outcomes = Array.from(await audit.evaluate());
    // For each failure or warning:
    outcomes.forEach((outcome, index) => {
      const {target} = outcome;
      if (target && ! target._members) {
        const outcomeJ = outcome.toJSON();
        const verdict = outcomeJ.outcome;
        if (verdict !== 'passed') {
          // Add to the result.
          const {rule} = outcomeJ;
          const {tags, uri, requirements} = rule;
          const ruleID = uri.replace(/^.+-/, '');
          const ruleSummary = ruleData[`sia-${ruleID}`] || '';
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
