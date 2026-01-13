/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  htmlcs
  This test implements the HTML CodeSniffer ruleset.
*/

// IMPORTS

// Module to add and use unique element IDs.
const {addTestaroIDs} = require('../procs/testaro');
// Module to get location data from an element.
const {getLocationData} = require('../procs/getLocatorData');
// Module to handle files.
const fs = require('fs/promises');

// FUNCTIONS

// Conducts and reports the HTML CodeSniffer tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules} = act;
  const data = {};
  const result = {};
  // Get the HTMLCS script.
  const scriptText = await fs.readFile(`${__dirname}/../htmlcs/HTMLCS.js`, 'utf8');
  const scriptNonce = report.jobData && report.jobData.lastScriptNonce;
  // Annotate all elements on the page with unique identifiers.
  await addTestaroIDs(page);
  let messageStrings = [];
  // Define the rules to be employed as those of WCAG 2 level AAA.
  for (const actStandard of ['WCAG2AAA']) {
    const nextViolations = await page.evaluate(args => {
      // Add the HTMLCS script to the page.
      const scriptText = args[2];
      const scriptNonce = args[3];
      const script = document.createElement('script');
      script.nonce = scriptNonce;
      script.textContent = scriptText;
      document.head.insertAdjacentElement('beforeend', script);
      // If only some rules are to be employed:
      const actStandard = args[0];
      const rules = args[1];
      if (rules && Array.isArray(rules) && rules.length) {
        // Redefine WCAG 2 AAA as including only them.
        if (! window.HTMLCS_WCAG2AAA) {
          window.HTMLCS_WCAG2AAA = {};
        }
        window.HTMLCS_WCAG2AAA.sniffs = rules;
      }
      let violations = null;
      // Run the tests.
      try {
        violations = window.HTMLCS_RUNNER.run(actStandard);
      }
      catch(error) {
        console.log(`ERROR executing HTMLCS_RUNNER on ${document.URL} (${error.message})`);
      }
      return violations;
    }, [actStandard, rules, scriptText, scriptNonce]);
    if (nextViolations && nextViolations.every(violation => typeof violation === 'string')) {
      messageStrings.push(... nextViolations);
    }
    else {
      data.prevented = true;
      data.error = 'ERROR executing HTMLCS_RUNNER in the page';
      break;
    }
  }
  if (! data.prevented) {
    // Sort the violations by class and standard.
    messageStrings.sort();
    // Remove any duplicate violations.
    messageStrings = [... new Set(messageStrings)];
    // Initialize the result.
    result.Error = {};
    result.Warning = {};
    // For each violation:
    for (const string of messageStrings) {
      // Split its message into severity class, rule ID, tagname, ID, rule description, and excerpt.
      const parts = string.split(/\|/, 6);
      const partCount = parts.length;
      if (partCount < 6) {
        console.log(`ERROR: Violation string ${string} has too few parts`);
      }
      // If it is an error or a warning (not a notice):
      else if (['Error', 'Warning'].includes(parts[0])) {
        /*
          Add the violation to a violationClass.violationCode.description array in the result.
          This saves space, because, although some descriptions are violation-specific, such as
          descriptions that state the contrast ratio of an element, most descriptions are
          generic, so typically many violations share a description.
        */
        const ruleID = parts[1].replace(/^WCAG2|\.Principle\d\.Guideline[\d_]+/g, '');
        result[parts[0]][ruleID] ??= {};
        result[parts[0]][ruleID][parts[4]] ??= [];
        const elementLocation = await getLocationData(page, parts[5]);
        const {boxID, notInDOM, pathID} = elementLocation;
        result[parts[0]][ruleID][parts[4]].push({
          tagName: parts[2],
          id: parts[3],
          notInDOM,
          excerpt: parts[5],
          boxID,
          pathID
        });
      }
    }
  }
  return {
    data,
    result
  };
};
