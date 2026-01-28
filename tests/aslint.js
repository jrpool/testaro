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
// Module to simplify strings.
const {cap, tidy} = require('../procs/job');
// Module to handle files.
const fs = require('fs/promises');
// Function to get location data with a Testaro identifier.
const {getElementData} = require('../procs/getLocatorData');
// Function to normalize an XPath.
const {getNormalizedXPath} = require('../procs/identify');

// CONSTANTS

/*
  Differentiates some rule IDs of aslint.
  If the purported rule ID is a key and the what property contains all of the strings except the
  last of any array item of the value of that key, then the final rule ID is the last item of that
  array item.
*/
const aslintData = {
  'misused_required_attribute': [
    ['not needed', 'misused_required_attributeR']
  ],
  'accessible_svg': [
    ['associated', 'accessible_svgI'],
    ['tabindex', 'accessible_svgT']
  ],
  'audio_alternative': [
    ['track', 'audio_alternativeT'],
    ['alternative', 'audio_alternativeA'],
    ['bgsound', 'audio_alternativeB']
  ],
  'table_missing_description': [
    ['describedby', 'associated', 'table_missing_descriptionDM'],
    ['labeledby', 'associated', 'table_missing_descriptionLM'],
    ['caption', 'not been defined', 'table_missing_descriptionC'],
    ['summary', 'empty', 'table_missing_descriptionS'],
    ['describedby', 'empty', 'table_missing_descriptionDE'],
    ['labeledby', 'empty', 'table_missing_descriptionLE'],
    ['caption', 'no content', 'table_missing_descriptionE']
  ],
  'label_implicitly_associated': [
    ['only whice spaces', 'label_implicitly_associatedW'],
    ['more than one', 'label_implicitly_associatedM']
  ],
  'label_inappropriate_association': [
    ['Missing', 'label_inappropriate_associationM'],
    ['non-form', 'label_inappropriate_associationN']
  ],
  'table_row_and_column_headers': [
    ['headers', 'table_row_and_column_headersRC'],
    ['Content', 'table_row_and_column_headersB'],
    ['head of the columns', 'table_row_and_column_headersH']
  ],
  'color_contrast_state_pseudo_classes_abstract': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_active': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_focus': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_state_pseudo_classes_hover': [
    ['position: fixed', 'color_contrast_state_pseudo_classes_abstractF'],
    ['transparent', 'color_contrast_state_pseudo_classes_abstractB'],
    ['least 3:1', 'color_contrast_state_pseudo_classes_abstract3'],
    ['least 4.5:1', 'color_contrast_state_pseudo_classes_abstract4']
  ],
  'color_contrast_aaa': [
    ['transparent', 'color_contrast_aaaB'],
    ['least 4.5:1', 'color_contrast_aaa4'],
    ['least 7:1', 'color_contrast_aaa7']
  ],
  'animation': [
    ['duration', 'animationD'],
    ['iteration', 'animationI'],
    ['mechanism', 'animationM']
  ],
  'page_title': [
    ['empty', 'page_titleN'],
    ['not identify', 'page_titleU']
  ],
  'aria_labelledby_association': [
    ['exist', 'aria_labelledby_associationN'],
    ['empty', 'aria_labelledby_associationE']
  ],
  'html_lang_attr': [
    ['parameters', 'html_lang_attrP'],
    ['nothing', 'html_lang_attrN'],
    ['empty', 'html_lang_attrE']
  ],
  'missing_label': [
    ['associated', 'missing_labelI'],
    ['defined', 'missing_labelN'],
    ['multiple labels', 'missing_labelM']
  ],
  'orientation': [
    ['loaded', 'orientationT']
  ]
};

// FUNCTIONS

// Conducts and reports the ASLint tests.
exports.reporter = async (page, report, actIndex) => {
  // Add unique Testaro identifiers to the elements in the page.
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
    try {
      const nativeResult = result.nativeResult = JSON.parse(actReport);
      // If any rules were reported violated:
      if (nativeResult.rules) {
        const {rules} = nativeResult;
        // For each such rule:
        for (const ruleID of Object.keys(rules)) {
          const ruleData = rules[ruleID];
          const {issueType, status} = ruleData;
          const excluded = act.rules && ! act.rules.includes(ruleID);
          const {type} = status;
          // If rule is not an error or warning or is not to be tested:
          if (
            excluded
            || ['passed', 'skipped'].includes(type)
            || ! ['error', 'warning'].includes(issueType)
          ) {
            // Delete the rule report.
            delete rules[ruleID];
          }
        }
        // If standard results are to be reported:
        if (standard) {
          const ruleIDs = Object.keys(rules);
          // For each violated rule:
          for (let ruleID of ruleIDs) {
            const ruleData = rules[ruleID];
            const {issueType, results} = ruleData;
            // For each violation:
            for (const result of results) {
              const {message, element} = result;
              const what = message?.actual?.description ?? '';
              // Get the values of the properties required for a standard result.
              if (ruleID) {
                const changer = aslintData[ruleID]?.find(
                  specs => specs.slice(0, -1).every(matcher => what.includes(matcher))
                );
                if (changer) {
                  ruleID = changer[changer.length - 1];
                }
              }
              const ordinalSeverity = issueType === 'warning' ? 1 : 2;
              const {html, xpath} = element;
              const excerpt = html?.replace(/\s+/g, ' ') ?? '';
              let tagName = '';
              let id = '';
              let text = [];
              let notInDOM = false;
              let boxID = '';
              let pathID = '';
              if (excerpt) {
                const elementData = await getElementData(page, excerpt);
                ({tagName, id, text, notInDOM, boxID, pathID, originalExcerpt} = elementData);
              }
              if (! pathID) {
                pathID = getNormalizedXPath(xpath);
              }
              if (pathID && ! tagName) {
                tagName = pathID?.replace(/[^-\w].*$/, '').toUpperCase() ?? '';
              }
              if (ruleID.endsWith('_svg') && ! tagName) {
                tagName = 'SVG';
              }
              // Add an instance to the standard result.
              standardResult.instances.push({
                ruleID,
                what,
                ordinalSeverity,
                count: 1,
                tagName,
                id,
                location: {
                  notInDOM,
                  doc: 'dom',
                  type: 'xpath',
                  spec: pathID
                },
                excerpt: cap(tidy(originalExcerpt)),
                text,
                boxID,
                pathID
              });
            }
          }
        }
      }
    }
    // If the results are not JSON:
    catch(error) {
      const message = `Result processing failed (${error.message})`;
      console.log(`ERROR: ${message}`);
      // Report this.
      data.prevented = true;
      data.error = message;
    }
  }
  return {
    data,
    result
  };
};
