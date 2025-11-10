/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

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
  testaro
  This test implements the Testaro evaluative rules.
*/

// ######## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');
// Module to handle files.
const fs = require('fs/promises');

// ######## CONSTANTS

// The validation job data for the tests listed below are in the pending directory.
/*
const futureEvalRulesTraining = {
  altScheme: 'img elements with alt attributes having URLs as their entire values',
  captionLoc: 'caption elements that are not first children of table elements',
  datalistRef: 'elements with ambiguous or missing referenced datalist elements',
  secHeading: 'headings that violate the logical level order in their sectioning containers',
  textSem: 'semantically vague elements i, b, and/or small'
};
const futureEvalRulesCleanRoom = {
  adbID: 'elements with ambiguous or missing referenced descriptions',
  imageLink: 'links with image files as their destinations',
  legendLoc: 'legend elements that are not first children of fieldset elements',
  optRoleSel: 'Non-option elements with option roles that have no aria-selected attributes',
  phOnly: 'input elements with placeholders but no accessible names'
};
*/
// The following were previously marked as future (clean-room) rules.
// For local validation runs they are included in evalRules below. Remove from futureRules
// when preparing clean-room submissions.
const futureRules = new Set([]);
const evalRules = {
  altScheme: 'img elements with alt attributes having URLs as their entire values',
  captionLoc: 'caption elements that are not first children of table elements',
  datalistRef: 'elements with ambiguous or missing referenced datalist elements',
  secHeading: 'headings that violate the logical level order in their sectioning containers',
  textSem: 'semantically vague elements i, b, and/or small',
  adbID: 'elements with ambiguous or missing referenced descriptions',
  imageLink: 'links with image files as their destinations',
  legendLoc: 'legend elements that are not first children of fieldset elements',
  optRoleSel: 'Non-option elements with option roles that have no aria-selected attributes',
  phOnly: 'input elements with placeholders but no accessible names',
  allCaps: 'leaf elements with entirely upper-case text longer than 7 characters',
  allHidden: 'page that is entirely or mostly hidden',
  allSlanted: 'leaf elements with entirely italic or oblique text longer than 39 characters',
  attVal: 'duplicate attribute values',
  autocomplete: 'name and email inputs without autocomplete attributes',
  bulk: 'large count of visible elements',
  buttonMenu: 'nonstandard keyboard navigation between items of button-controlled menus',
  distortion: 'distorted text',
  docType: 'document without a doctype property',
  dupAtt: 'elements with duplicate attributes',
  embAc: 'active elements embedded in links or buttons',
  focAll: 'discrepancies between focusable and Tab-focused elements',
  focInd: 'missing and nonstandard focus indicators',
  focOp: 'Tab-focusable elements that are not operable',
  focVis: 'links that are not entirely visible when focused',
  headEl: 'invalid elements within the head',
  headingAmb: 'same-level sibling headings with identical texts',
  hover: 'hover-caused content changes',
  hovInd: 'hover indication nonstandard',
  hr: 'hr element instead of styles used for vertical segmentation',
  labClash: 'labeling inconsistencies',
  lineHeight: 'text with a line height less than 1.5 times its font size',
  linkAmb: 'links with identical texts but different destinations',
  linkExt: 'links that automatically open new windows',
  linkOldAtt: 'links with deprecated attributes',
  linkTitle: 'links with title attributes repeating text content',
  linkTo: 'links without destinations',
  linkUl: 'missing underlines on inline links',
  miniText: 'text smaller than 11 pixels',
  motion: 'motion without user request',
  nonTable: 'table elements used for layout',
  opFoc: 'operable elements that are not Tab-focusable',
  pseudoP: 'adjacent br elements suspected of nonsemantically simulating p elements',
  radioSet: 'radio buttons not grouped into standard field sets',
  role: 'native-replacing explicit roles',
  styleDiff: 'style inconsistencies',
  tabNav: 'nonstandard keyboard navigation between elements with the tab role',
  targetSmall: 'buttons, inputs, and non-inline links smaller than 44 pixels wide and high',
  targetTiny: 'buttons, inputs, and non-inline links smaller than 24 pixels wide and high',
  titledEl: 'title attributes on inappropriate elements',
  zIndex: 'non-default Z indexes'
};
const etcRules = {
  attVal: 'elements with attributes having illicit values',
  elements: 'data on specified elements',
  textNodes: 'data on specified text nodes',
  title: 'page title',
};

// ######## FUNCTIONS

// Conducts a JSON-defined test.
const jsonTest = async (ruleID, ruleArgs) => {
  const [page, withItems] = ruleArgs;
  // Get the rule definition.
  const ruleJSON = await fs.readFile(`${__dirname}/../testaro/${ruleID}.json`, 'utf8');
  const ruleObj = JSON.parse(ruleJSON);
  // Initialize the locators and result.
  const all = await init(100, page, ruleObj.selector);
  all.locs = all.allLocs;
  // Populate and return the result.
  const whats = [
    ruleObj.complaints.instance,
    ruleObj.complaints.summary
  ];
  return await report(
    withItems, all, ruleObj.ruleID, whats, ruleObj.ordinalSeverity, ruleObj.summaryTagName
  );
};
// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
// Conducts and reports Testaro tests.
exports.reporter = async (page, report, actIndex) => {
  const url = await page.url();
  const browser = page.context().browser();
  const act = report.acts[actIndex];
  const {args, stopOnFail, withItems} = act;
  const argRules = args ? Object.keys(args) : null;
  const rules = act.rules || ['y', ... Object.keys(evalRules)];
  // Initialize the act report.
  const data = {
    prevented: false,
    error: '',
    rulePreventions: [],
    rulePreventionMessages: {},
    rulesInvalid: [],
    ruleTestTimes: {}
  };
  const result = {};
  // If the rule specification is valid:
  if (
    rules.length > 1
    && ['y', 'n'].includes(rules[0])
    && rules.slice(1).every(rule => {
      if (evalRules[rule] || etcRules[rule] || futureRules.has(rule)) {
        return true;
      }
      else {
        console.log(`ERROR: Testaro rule ${rule} invalid`);
        return false;
      }
    })
  ) {
    // Wait 1 second to prevent out-of-order logging with granular reporting.
    await wait(1000);
    // For each rule invoked except future rules:
    const calledRules = rules[0] === 'y'
      ? rules.slice(1)
      : Object.keys(evalRules).filter(ruleID => ! rules.slice(1).includes(ruleID));
    const testTimes = [];
    for (const rule of calledRules.filter(rule => ! futureRules.has(rule))) {
      // Recreate a page for the test.
      const context = await browser.newContext();
      page = await context.newPage();
      await page.goto(url);
      // Initialize an argument array.
      const ruleArgs = [page, withItems];
      // If the rule is defined with JavaScript or JSON but not both:
      const ruleFileNames = await fs.readdir(`${__dirname}/../testaro`);
      const isJS = ruleFileNames.includes(`${rule}.js`);
      const isJSON = ruleFileNames.includes(`${rule}.json`);
      if ((isJS || isJSON) && ! (isJS && isJSON)) {
        // If with JavaScript and it has extra arguments:
        if (isJS && argRules && argRules.includes(rule)) {
          // Add them to the argument array.
          ruleArgs.push(... args[rule]);
        }
        // Test the page.
        if (! result[rule]) {
          result[rule] = {};
        }
        const what = evalRules[rule] || etcRules[rule];
        result[rule].what = what;
        const startTime = Date.now();
        try {
          // Apply a 15-second time limit to the test. If it expires:
          let timeout;
          const timer = new Promise(resolve => {
            timeout = setTimeout(() => {
              // Add data about the test, including its prevention, to the result.
              const endTime = Date.now();
              testTimes.push([rule, Math.round((endTime - startTime) / 1000)]);
              data.rulePreventions.push(rule);
              result[rule].totals = [0, 0, 0, 0];
              result[rule].standardInstances = [];
              console.log(`ERROR: Test of testaro rule ${rule} timed out`);
              resolve({timedOut: true});
            }, 15000);
          });
          const ruleReport = isJS
            ? require(`../testaro/${rule}`).reporter(... ruleArgs)
            : jsonTest(rule, ruleArgs);
          const timeoutReport = await Promise.race([timer, ruleReport]);
          clearTimeout(timeout);
          // If the test was completed before the deadline:
          if (! timeoutReport.timedOut) {
            // Add data from the test to the result.
            const endTime = Date.now();
            testTimes.push([rule, Math.round((endTime - startTime) / 1000)]);
            Object.keys(timeoutReport).forEach(key => {
              result[rule][key] = timeoutReport[key];
            });
            result[rule].totals = result[rule].totals.map(total => Math.round(total));
            // If testing is to stop after a failure and the page failed the test:
            if (stopOnFail && timeoutReport.totals.some(total => total)) {
              // Stop testing.
              break;
            }
          }
        }
        // If an error is thrown by the test:
        catch(error) {
          // Report this.
          data.rulePreventions.push(rule);
          data.rulePreventionMessages[rule] = error.message;
          console.log(`ERROR: Test of testaro rule ${rule} prevented (${error.message})`);
        }
      }
      // Otherwise, i.e. if the rule is undefined or doubly defined:
      else {
        // Report this.
        data.rulesInvalid.push(rule);
        console.log(`ERROR: Rule ${rule} not validly defined`);
      }
      context.close();
    }
    testTimes.sort((a, b) => b[1] - a[1]).forEach(pair => {
      data.ruleTestTimes[pair[0]] = pair[1];
    });
  }
  // Otherwise, i.e. if the rule specification is invalid:
  else {
    const message = 'ERROR: Testaro rule specification invalid';
    console.log(message);
    data.prevented = true;
    data.error = message;
  }
  return {
    data,
    result
  };
};
