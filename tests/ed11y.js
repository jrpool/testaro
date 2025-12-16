/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  ed11y
  This test implements the Editoria11y ruleset for accessibility.
*/

// IMPORTS

// Module to handle files.
const fs = require('fs/promises');
// Module to get the XPath of an element.
const {xPath} = require('playwright-dompath');

// FUNCTIONS

// Performs and reports the Editoria11y tests.
exports.reporter = async (page, report, actIndex, timeLimit) => {
  // Get the nonce, if any.
  const act = report.acts[actIndex];
  const {jobData} = report;
  const scriptNonce = jobData && jobData.lastScriptNonce;
  // Get the tool script.
  const script = await fs.readFile(`${__dirname}/../ed11y/editoria11y.min.js`, 'utf8');
  // Perform the tests and get the violating elements and violation facts.
  const reportJSHandle = await page.evaluateHandle(args => new Promise(async resolve => {
    const {scriptNonce, script, rulesToTest, timeLimit} = args;
    // If the report is incomplete after the time limit:
    const timer = setTimeout(() => {
      // Return this as the report.
      resolve({
        result: {
          prevented: true,
          error: `ed11y timed out at ${timeLimit} seconds`
        }
      });
    }, 1000 * timeLimit);
    // When the script has been executed, creating data in an Ed11y object:
    document.addEventListener('ed11yResults', () => {
      // Initialize a report containing violating elements and violation facts.
      const report = {
        elements: [],
        facts:  {}
      };
      const {elements, facts} = report;
      // Populate the global facts.
      [
        'version',
        'options',
        'mediaCount',
        'errorCount',
        'warningCount',
        'dismissedCount',
        'totalCount'
      ]
      .forEach(key => {
        try {
          facts[key] = Ed11y[key];
        }
        catch(error) {
          console.log(`ERROR: invalid value of ${key} property of Ed11y (${error.message})`);
        }
      });
      // Get data on violating text alternatives of images from Ed11y.
      facts.imageAlts = Ed11y
      .imageAlts
      .filter(item => item[3] !== 'pass')
      .map(item => item.slice(1));
      // Delete useless facts.
      delete facts.options.sleekTheme;
      delete facts.options.darkTheme;
      delete facts.options.lightTheme;
      // Initialize the violation facts.
      facts.violations = [];
      // For each rule violation by an element:
      Ed11y.results.forEach(violation => {
        // If rules were not selected or they were and include the violated rule:
        if (! rulesToTest || rulesToTest.includes(violation.test)) {
          const violationFacts = {};
          violationFacts.test = violation.test || '';
          // If the element is in the page:
          if (violation.content) {
            violationFacts.content = violation.content.replace(/\s+/g, ' ');
          }
          const {element} = violation;
          if (element.outerHTML) {
            // Add the element to the report.
            elements.push(element);
            // Add its violation facts to the report.
            violationFacts.tagName = element.tagName || '';
            violationFacts.id = element.id || '';
            violationFacts.loc = {};
            const locRect = element.getBoundingClientRect();
            if (locRect) {
              ['x', 'y', 'width', 'height'].forEach(dim => {
                violationFacts.loc[dim] = Math.round(locRect[dim], 0);
              });
            }
            let elText = element.textContent.replace(/\s+/g, ' ').trim();
            if (! elText) {
              elText = element.outerHTML;
            }
            if (elText.length > 400) {
              elText = `${elText.slice(0, 200)}…${elText.slice(-200)}`;
            }
            violationFacts.excerpt = elText.replace(/\s+/g, ' ');
            violationFacts.boxID = ['x', 'y', 'width', 'height']
            .map(dim => violationFacts.loc[dim])
            .join(':');
            facts.violations.push(violationFacts);
          }
        }
      });
      // Return the report.
      clearTimeout(timer);
      resolve(report);
    });
    // Add the tool script to the page.
    const toolScript = document.createElement('script');
    if (scriptNonce) {
      toolScript.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to tool script`);
    }
    toolScript.textContent = script;
    document.body.insertAdjacentElement('beforeend', toolScript);
    // Execute the tool script, creating Ed11y and triggering the event listener.
    try {
      await new Ed11y({
        alertMode: 'headless'
      });
    }
    catch(error) {
      resolve({
        result: {
          prevented: true,
          error: error.message
        }
      });
    };
  }), {
    scriptNonce,
    script,
    rulesToTest: act.rules,
    timeLimit
  });
  // Initialize the result as the violation facts.
  const resultJSHandle = await reportJSHandle.getProperty('facts');
  const result = await resultJSHandle.jsonValue();
  // If there were any violation facts:
  if (result) {
    // Get the violations from them.
    const {violations} = result;
    // If any exist:
    if (violations && violations.length) {
      // Get the violating elements.
      const elementsJSHandle = await reportJSHandle.getProperty('elements');
      const elementJSHandles = await elementsJSHandle.getProperties();
      // For each violation:
      for (const index in violations) {
        // Get its path ID from the identically indexed element.
        const elementHandle = elementJSHandles.get(index).asElement();
        const pathID = await xPath(elementHandle);
        // Add the path ID to the violation facts of the result.
        violations[index].pathID = pathID;
      };
    }
    // Return the data and result, discarding the separate element data.
    const data = {};
    if (result.prevented) {
      data.prevented = true;
    }
    return {
      data,
      result
    };
  }
  // Otherwise, i.e. if there were no violation facts:
  else {
    // Return this.
    return {
      data: {},
      result: {}
    }
  }
};
