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
const {getAttributeXPath, getXPathCatalogIndex} = require('../procs/xPath');

// CONSTANTS

const qualWeb = new QualWeb({
  adBlock: true,
  stealth: true
});
const actRulesModule = new ACTRules({});
const wcagModule = new WCAGTechniques({});
const bpModule = new BestPractices({});
const ordinalSeverities = {
  'act-rules': {
    'warning': 1,
    'failure': 3
  },
  'wcag-techniques': {
    'warning': 0,
    'failure': 2
  },
  'best-practices': {
    'warning': 0,
    'failure': 1
  }
}

// FUNCTIONS

// Conducts and reports the QualWeb tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
  const act = report.acts[actIndex];
  const {withNewContent, rules} = act;
  const clusterOptions = {
    maxConcurrency: 1,
    timeout: timeLimit * 1000,
    monitor: false
  };
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
    result.nativeResult = qwReport[withNewContent ? qualWebOptions.url : 'customHtml'];
    const {nativeResult, standardResult} = result;
    // If it contains a copy of the DOM:
    if (nativeResult?.system?.page?.dom) {
      // Delete the copy.
      delete nativeResult.system.page.dom;
      const {modules} = nativeResult;
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
                  // If there were any warnings or failures:
                  if (metadata?.warning || metadata?.failed) {
                    // Delete nonviolations from the results.
                    ruleAssertions.results = ruleAssertions.results.filter(
                      raResult => raResult.verdict !== 'passed'
                    );
                    // For each test result:
                    for (const raResult of ruleAssertions.results) {
                      const {elements, verdict} = raResult;
                      // If any violations are reported:
                      if (elements?.length) {
                        // For each violating element:
                        for (const element of elements) {
                          // Limit the size of its reported excerpt.
                          if (element.htmlCode && element.htmlCode.length > 2000) {
                            element.htmlCode = `${element.htmlCode.slice(0, 2000)} …`;
                          }
                          // If standard results are to be reported:
                          if (standard) {
                            // Initialize a standard instance.
                            const instance = {
                              ruleID,
                              what: raResult.description,
                              ordinalSeverity: ordinalSeverities[section][verdict],
                              count: 1
                            };
                            // Get the pathID of the element or, if none, the document pathID.
                            const pathID = getAttributeXPath(element.htmlCode) || '/html';
                            const {catalog} = report;
                            // Use it to get the catalog index.
                            const catalogIndex = getXPathCatalogIndex(catalog, pathID);
                            // If the acquisition succeeded:
                            if (catalogIndex) {
                              // Add the catalog index to the instance.
                              instance.catalogIndex = catalogIndex;
                            }
                            // Otherwise, i.e. if the acquisition failed:
                            else {
                              // Add the XPath to the instance.
                              instance.pathID = pathID;
                            }
                            // Add the instance to the standard result.
                            standardResult.instances.push(instance);
                          }
                        };
                      }
                    };
                  }
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
