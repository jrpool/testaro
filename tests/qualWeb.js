/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  qualWeb
  This test implements the QualWeb ruleset for accessibility.
*/

// IMPORTS

const {QualWeb} = require('@qualweb/core');
const {ACTRules} = require('@qualweb/act-rules');
const {WCAGTechniques} = require('@qualweb/wcag-techniques');
const {BestPractices} = require('@qualweb/best-practices');

// CONSTANTS

const qualWeb = new QualWeb({
  adBlock: true,
  stealth: true
});
const actRulesModule = new ACTRules({});
const wcagModule = new WCAGTechniques({});
const bpModule = new BestPractices({});

// FUNCTIONS

// Conducts and reports the QualWeb tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
  const act = report.acts[actIndex];
  const {withNewContent, rules} = act;
  const data = {};
  let result = {};
  const clusterOptions = {
    maxConcurrency: 1,
    timeout: timeLimit * 1000,
    monitor: false
  };
  try {
    // Start the QualWeb core engine.
    await qualWeb.start(clusterOptions, {
      headless: true
    });
  }
  // If the start fails:
  catch(error) {
    return {
      data: {
        prevented: true,
        error: `Core engine start failed (${error.message})`
      },
      result
    };
  }
  // Otherwise, i.e. if the start succeeds, specify the invariant test options.
  const qualWebOptions = {
    log: {
      console: false,
      file: false
    },
    crawlOptions: {
      maxDepth: 0,
      maxUrls: 1,
      timeout: timeLimit * 1000,
      maxParallelCrawls: 1,
      logging: true
    },
    execute: {
      counter: true
    },
    modules: []
  };
  // Specify a URL or provide the content.
  try {
    if (withNewContent) {
      qualWebOptions.url = page.url();
    }
    else {
      qualWebOptions.html = await page.content();
    }
    // Specify which rules to test for, adding a custom execute property for report processing.
    const actSpec = rules ? rules.find(typeRules => typeRules.startsWith('act:')) : null;
    const wcagSpec = rules ? rules.find(typeRules => typeRules.startsWith('wcag:')) : null;
    const bestSpec = rules ? rules.find(typeRules => typeRules.startsWith('best:')) : null;
    if (actSpec) {
      if (actSpec === 'act:') {
        qualWebOptions.execute.act = false;
      }
      else {
        const actRules = actSpec.slice(4).split(',').map(num => `QW-ACT-R${num}`);
        qualWebOptions['act-rules'] = {rules: actRules};
        qualWebOptions.modules.push(actRulesModule);
        qualWebOptions.execute.act = true;
      }
    }
    else {
      qualWebOptions['act-rules'] = {
        levels: ['A', 'AA', 'AAA'],
        principles: ['Perceivable', 'Operable', 'Understandable', 'Robust']
      };
      qualWebOptions.modules.push(actRulesModule);
      qualWebOptions.execute.act = true;
    }
    if (wcagSpec) {
      if (wcagSpec === 'wcag:') {
        qualWebOptions.execute.wcag = false;
      }
      else {
        const wcagTechniques = wcagSpec.slice(5).split(',').map(num => `QW-WCAG-T${num}`);
        qualWebOptions['wcag-techniques'] = {techniques: wcagTechniques};
        qualWebOptions.modules.push(wcagModule);
        qualWebOptions.execute.wcag = true;
      }
    }
    else {
      qualWebOptions['wcag-techniques'] = {
        levels: ['A', 'AA', 'AAA'],
        principles: ['Perceivable', 'Operable', 'Understandable', 'Robust']
      };
      qualWebOptions.modules.push(wcagModule);
      qualWebOptions.execute.wcag = true;
    }
    if (bestSpec) {
      if (bestSpec === 'best:') {
        qualWebOptions.execute.bp = false;
      }
      else {
        const bestPractices = bestSpec.slice(5).split(',').map(num => `QW-BP${num}`);
        qualWebOptions['best-practices'] = {bestPractices};
        qualWebOptions.modules.push(bpModule);
        qualWebOptions.execute.bp = true;
      }
    }
    else {
      qualWebOptions['best-practices'] = {};
      qualWebOptions.modules.push(bpModule);
      qualWebOptions.execute.bp = true;
    }
    let qwReport;
    try {
      // Get the report.
      qwReport = await qualWeb.evaluate(qualWebOptions);
    }
    catch(error) {
      return {
        data: {
          prevented: true,
          error: `qualWeb evaluation failed (${error.message})`
        },
        result
      };
    }
    // Otherwise, i.e. if the evaluation succeeded, get the report.
    result = qwReport[withNewContent ? qualWebOptions.url : 'customHtml'];
    // If it contains a copy of the DOM:
    if (result && result.system && result.system.page && result.system.page.dom) {
      // Delete the copy.
      delete result.system.page.dom;
      const {modules} = result;
      // If the report contains a modules property:
      if (modules) {
        // For each test section in it:
        for (const section of ['act-rules', 'wcag-techniques', 'best-practices']) {
          // If testing in the section was specified:
          if (qualWebOptions[section]) {
            // If the section exists:
            if (modules[section]) {
              const {assertions} = modules[section];
              // If it contains assertions (test results):
              if (assertions) {
                const ruleIDs = Object.keys(assertions);
                // For each rule:
                for (const ruleID of ruleIDs) {
                  const ruleAssertions = assertions[ruleID];
                  const {metadata} = ruleAssertions;
                  // If result data exist for the rule:
                  if (metadata) {
                    // If there were no warnings or failures:
                    if (metadata.warning === 0 && metadata.failed === 0) {
                      // Delete the rule data.
                      delete assertions[ruleID];
                    }
                    // Otherwise, i.e. if there was at least 1 warning or failure:
                    else {
                      if (ruleAssertions.results) {
                        // Delete nonviolations from the results.
                        ruleAssertions.results = ruleAssertions.results.filter(
                          raResult => raResult.verdict !== 'passed'
                        );
                      }
                    }
                  }
                  // Shorten long HTML codes of elements.
                  const {results} = ruleAssertions;
                  // For each test result:
                  for (const raResult of results) {
                    const {elements} = raResult;
                    // If any violations are reported:
                    if (elements && elements.length) {
                      // For each violating element:
                      for (const element of elements) {
                        // Limit the size of its reported excerpt.
                        if (element.htmlCode && element.htmlCode.length > 700) {
                          element.htmlCode = `${element.htmlCode.slice(0, 700)} …`;
                        }
                      };
                    }
                  };
                };
              }
              else {
                data.prevented = true;
                data.error = 'No assertions';
              }
            }
            else {
              data.prevented = true;
              data.error = `No ${section} section`;
            }
          }
        }
      }
      else {
        data.prevented = true;
        data.error = 'No modules';
      }
    }
    else {
      data.prevented = true;
      data.error = 'No DOM';
    }
    // Stop the QualWeb core engine.
    await qualWeb.stop();
    // Test whether the result is an object.
    try {
      JSON.stringify(result);
    }
    catch(error) {
      data.prevented = true;
      data.error = `qualWeb result cannot be made JSON (${error.message})`;
    }
  }
  catch(error) {
    data.prevented = true;
    data.error = `qualWeb evaluation failed (${error.message})`;
  }
  return {
    data,
    result
  };
};
