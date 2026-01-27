/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  aslint
  This test implements the ASLint ruleset for accessibility.
*/

// IMPORTS

// Function to add unique identifiers to the elements in the page.
const {addTestaroIDs} = require('../procs/testaro');
// Module to handle files.
const fs = require('fs/promises');
// Function to get location data from an element.
const {getLocationData} = require('../procs/getLocatorData');
// Function to normalize an XPath.
const {getNormalizedXPath} = require('../procs/identify');

// FUNCTIONS

// Conducts and reports the ASLint tests.
exports.reporter = async (page, report, actIndex) => {
  // Add unique identifiers to the elements in the page.
  await addTestaroIDs(page);
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
  const {standardResult} = result;
  // Get the ASLint runner and bundle scripts.
  const aslintRunner = await fs.readFile(`${__dirname}/../procs/aslint.js`, 'utf8');
  const aslintBundlePath = require.resolve('aslint-testaro/aslint.bundle.js');
  const aslintBundle = await fs.readFile(aslintBundlePath, 'utf8');
  // Get the nonce, if any.
  const act = report.acts[actIndex];
  const {jobData} = report;
  const scriptNonce = jobData && jobData.lastScriptNonce;
  // Inject the ASLint bundle and runner into the head of the page.
  await page.evaluate(args => {
    const {scriptNonce, aslintBundle, aslintRunner} = args;
    // Bundle.
    const bundleEl = document.createElement('script');
    bundleEl.id = 'aslintBundle';
    if (scriptNonce) {
      bundleEl.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to bundle`);
    }
    bundleEl.textContent = aslintBundle;
    document.head.insertAdjacentElement('beforeend', bundleEl);
    // Runner.
    const runnerEl = document.createElement('script');
    if (scriptNonce) {
      runnerEl.nonce = scriptNonce;
      console.log(`Added nonce ${scriptNonce} to runner`);
    }
    runnerEl.textContent = aslintRunner;
    document.body.insertAdjacentElement('beforeend', runnerEl);
  }, {scriptNonce, aslintBundle, aslintRunner})
  .catch(error => {
    const message = `ERROR: ASLint injection failed (${error.message.slice(0, 400)})`;
    console.log(message);
    data.prevented = true;
    data.error = message;
    if (standard) {
      standardResult.prevented = true;
    }
  });
  const reportLoc = page.locator('#aslintResult');
  // If the injection succeeded:
  if (! data.prevented) {
    try {
      // Wait for the test results to be attached to the page.
      const waitOptions = {
        state: 'attached',
        timeout: 20000
      };
      await reportLoc.waitFor(waitOptions);
    }
    catch(error) {
      const message = 'Attachment of test results to page failed';
      console.log(message);
      data.prevented = true;
      data.error = `${message} (${error.message})`;
    };
  }
  // If the injection and the result attachment both succeeded:
  if (! data.prevented) {
    // Get their text.
    const actReport = await reportLoc.textContent();
    const nativeResult = result.nativeResult = JSON.parse(actReport);
    // If any rules were reported violated:
    if (nativeResult.rules) {
      const {rules} = nativeResult;
      // For each such rule:
      for (const ruleID of Object.keys(rules)) {
        const excluded = act.rules && ! act.rules.includes(ruleID);
        const instanceType = rules[ruleID].status.type;
        // If rules to be tested were specified and exclude it or the rule was passed or skipped:
        if (excluded || ['passed', 'skipped'].includes(instanceType)) {
          // Delete the rule report.
          delete rules[ruleID];
        }
      }
      console.log(`XXX result:\n${JSON.stringify(result, null, 2)}`);
    }
  }
};
/*
      // If standard results are to be reported:
      if (standard) {
        const ruleResults = rules[ruleID].results;
        // For each violation:
        for (const ruleResult of ruleResults) {
          const excerpt = ruleResult.element
          && ruleResult.element.html.replace(/\s+/g, ' ')
          || '';
          // If an element excerpt was reported:
          if (excerpt) {
            // Use it to add location data to the violation data in the result.
            const locationData = await getLocationData(page, excerpt);
          }
        };
      }
      };
      // If the ASLint results are in the expected format:
      if (nativeResult?.summary?.byIssueType) {
        // For each rule:
        Object.keys(result.rules).forEach(ruleID => {
          const {issueType} = result.rules[ruleID];
          // If it has a valid issue type:
          if (issueType && ['warning', 'error'].includes(issueType)) {
            const ruleResults = result.rules[ruleID].results;
            // If there are any violations:
            if (ruleResults && ruleResults.length) {
              // For each violation:
              ruleResults.forEach(ruleResult => {
                // If it has a description:
                if (
                  ruleResult.message
                  && ruleResult.message.actual
                  && ruleResult.message.actual.description
                ) {
                  const what = ruleResult.message.actual.description;
                  // Get the differentiated ID of the rule if any.
                  const ruleData = aslintData[ruleID];
                  let finalRuleID = ruleID;
                  if (ruleData) {
                    const changer = ruleData.find(
                      specs => specs.slice(0, -1).every(matcher => what.includes(matcher))
                    );
                    if (changer) {
                      finalRuleID = changer[changer.length - 1];
                    }
                  }
                  // Initialize the path ID of the element as any normalized reported XPath.
                  let pathID = getNormalizedXPath(ruleResult?.element?.xpath);
                  const {locationData} = ruleResult;
                  // If an XPath was obtained from the excerpt:
                  if (locationData && locationData.pathID) {
                    // Replace the path ID with it, because some ASLint-reported XPaths are abbreviated.
                    ({pathID} = locationData);
                  }
                  // Get and normalize the reported excerpt.
                  const excerpt = (ruleResult?.element?.html || '').replace(/\s+/g, ' ');
                  // Get the tag name from the XPath, if possible.
                  let tagName = pathID && pathID.replace(/[^-\w].*$/, '').toUpperCase() || '';
                  if (! tagName && finalRuleID.endsWith('_svg')) {
                    tagName = 'SVG';
                  }
                  // If that was impossible but there is a tag name in the excerpt:
                  if (! tagName && /^<[a-z]+[ >]/.test(excerpt)) {
                    // Get it.
                    tagName = excerpt.slice(1).replace(/[ >].+/, '').toUpperCase();
                  }
                  // Get the ID, if any.
                  const idDraft = excerpt
                  && excerpt.replace(/^[^[>]+id="/, 'id=').replace(/".*$/, '');
                  const idFinal = idDraft && idDraft.length > 3 && idDraft.startsWith('id=')
                    ? idDraft.slice(3)
                    : '';
                  const id = idFinal === '' || isBadID(idFinal) ? '' : idFinal;
                  const instance = {
                    ruleID: finalRuleID,
                    what,
                    ordinalSeverity: ['warning', 0, 0, 'error'].indexOf(issueType),
                    tagName,
                    id,
                    location: {
                      doc: 'dom',
                      type: 'xpath',
                      spec: pathID
                    },
                    excerpt,
                    boxID: '',
                    pathID
                  };
                  standardResult.instances.push(instance);
                }
              });
            }
          }
        });
      }
    }
  }
  // Return the act report.
  try {
    JSON.stringify(data);
  }
  catch(error) {
    const message = `ERROR: ASLint result cannot be made JSON (${error.message.slice(0, 200)})`;
    data = {
      prevented: true,
      error: message
    };
  };
  return {
    data,
    result
  };
};
*/
