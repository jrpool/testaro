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
const {cap, tidy} = require('../procs/job');
const {getIdentifiers} = require('../procs/standardize');
const {getNormalizedXPath} = require('../procs/identify');
const {Playwright} = require('@siteimprove/alfa-playwright');

// FUNCTIONS

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
    nativeResult: {
      totals: {
        failed: 0,
        cantTell: 0
      },
      items: []
    },
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
    // Wait for a stable page to make the page and its alfa version consistent.
    await page.waitForLoadState('networkidle', {timeout: 2000});
    const doc = await page.evaluateHandle('document');
    const alfaPage = await Playwright.toPage(doc);
    // Test the page content with the specified rules.
    const audit = Audit.of(alfaPage, alfaRules);
    // Get the evaluations.
    const evaluations = Array.from(await audit.evaluate());
    const {nativeResult, standardResult} = result;
    // For each of them:
    for (const index in evaluations) {
      const evaluation = evaluations[index];
      const targetClass = evaluation.target;
      // If it has a non-collection violator:
      if (targetClass && ! targetClass._members) {
        // Convert the evaluation to an item.
        const item = evaluation.toJSON();
        const {diagnostic, expectations, outcome, rule, target} = item;
        // If the outcome of the item is a failure or warning:
        if (['failed', 'cantTell'].includes(outcome)) {
          // Delete typically massive properties unlikely to be useful.
          delete target.children;
          if (diagnostic?.errors) {
            diagnostic.errors.forEach(error => {
              delete error.element;
              delete error.positionedDescendants;
            });
          }
          // Increment the applicable total.
          nativeResult.totals[outcome]++;
          const codeLines = targetClass.toString().split('\n');
          if (codeLines[0] === '#document') {
            codeLines.splice(2, codeLines.length - 3, ' … ');
          }
          else if (codeLines[0].startsWith('<html')) {
            codeLines.splice(1, codeLines.length - 2, ' … ');
          }
          let code = codeLines.join('/n');
          if (code.length > 400) {
            code = `${code.slice(0, 300)} … ${code.slice(-100)}`;
          }
          // Add properties of the evaluation to the item.
          item.code = code;
          item.path = targetClass.path();
          // Add the item to the items of the native result.
          nativeResult.items.push(item);
          // If standard results are to be reported:
          if (standard) {
            const {requirements, uri} = rule;
            // Get properties required for a standard instance.
            const pathID = getNormalizedXPath(item.path.replace(/\/text\(\).*$/, ''));
            const {name} = target;
            let tagName = name?.toUpperCase();
            if (pathID && tagName?.startsWith('TEXT') || ! tagName) {
              tagName = pathID.split('/').pop().replace(/\[.+/, '').toUpperCase() || '';
            }
            let boxID = '';
            const targetLoc = page.locator(`xpath=${pathID}`);
            try {
              const box = await targetLoc.boundingBox({timeout: 50});
              if (box) {
                boxID = Object.values(box).join(':');
              }
            }
            catch(error) {}
            const text = [];
            try {
              const textRaw = await targetLoc.innerText({timeout: 50});
              const segments = textRaw?.trim().split(/[\t\n]+/).filter(segment => segment.length);
              if (segments?.length) {
                if (segments.length > 1) {
                  text.push(segments[0], segments[segments.length - 1]);
                }
                else {
                  text.push(segments[0]);
                }
              }
            }
            catch(error) {}
            // Get rule-specific properties of a standard instance.
            let ruleID = uri.replace(/^.+-/, '');
            let what = tidy(expectations?.[0]?.[1]?.error?.message || '');
            if (! what) {
              if (requirements && requirements.length && requirements[0].title) {
                what = requirements[0].title;
              }
            }
            let ordinalSeverity = 2;
            // If the outcome is untestability:
            if (outcome === 'cantTell') {
              // Revise the rule-specific properties.
              ruleID = ['r66', 'r69'].includes(ruleID) ? 'cantTell' : 'cantTellTextContrast';
              what = `cannot test for rule ${ruleID}: ${what}`;
              ordinalSeverity = 0;
            }
            // Increment the standard total.
            standardResult.totals[ordinalSeverity]++;
            // Add a standard instance to the standard result.
            standardResult.instances.push({
              ruleID,
              what,
              ordinalSeverity,
              count: 1,
              tagName,
              id: getIdentifiers(code)[1],
              location: {
                doc: 'dom',
                type: 'xpath',
                spec: pathID
              },
              excerpt: cap(tidy(item.code)),
              text,
              boxID,
              pathID
            });
          }
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
