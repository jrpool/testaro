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

// IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Function to launch a browser.
const {launch} = require('../run');
// Module to handle files.
const fs = require('fs/promises');

// CONSTANTS

// Metadata of all rules in default execution order.
const allRules = [
  {
    id: 'shoot0',
    what: 'first page screenshot',
    launchRole: 'owner',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'adbID',
    what: 'elements with ambiguous or missing referenced descriptions',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'allCaps',
    what: 'leaf elements with entirely upper-case text longer than 7 characters',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'allHidden',
    what: 'page that is entirely or mostly hidden',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'allSlanted',
    what: 'leaf elements with entirely italic or oblique text longer than 39 characters',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'altScheme',
    what: 'img elements with alt attributes having URLs as their entire values',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'attVal',
    what: 'elements with attributes having illicit values',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: false
  },
  {
    id: 'dupAtt',
    what: 'duplicate attribute values',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'autocomplete',
    what: 'name and email inputs without autocomplete attributes',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'bulk',
    what: 'large count of visible elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'captionLoc',
    what: 'caption elements that are not first children of table elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'datalistRef',
    what: 'elements with ambiguous or missing referenced datalist elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'distortion',
    what: 'distorted text',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'docType',
    what: 'document without a doctype property',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'dupAtt',
    what: 'elements with duplicate attributes',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'embAc',
    what: 'active elements embedded in links or buttons',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'headEl',
    what: 'invalid elements within the head',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'headingAmb',
    what: 'same-level sibling headings with identical texts',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'hr',
    what: 'hr element instead of styles used for vertical segmentation',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'imageLink',
    what: 'links with image files as their destinations',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'labClash',
    what: 'labeling inconsistencies',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'legendLoc',
    what: 'legend elements that are not first children of fieldset elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'lineHeight',
    what: 'text with a line height less than 1.5 times its font size',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'linkAmb',
    what: 'links with identical texts but different destinations',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkExt',
    what: 'links that automatically open new windows',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkOldAtt',
    what: 'links with deprecated attributes',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkTitle',
    what: 'links with title attributes repeating text content',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkTo',
    what: 'links without destinations',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkUl',
    what: 'missing underlines on inline links',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'miniText',
    what: 'text smaller than 11 pixels',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'nonTable',
    what: 'table elements used for layout',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'optRoleSel',
    what: 'Non-option elements with option roles that have no aria-selected attributes',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'phOnly',
    what: 'input elements with placeholders but no accessible names',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'pseudoP',
    what: 'adjacent br elements suspected of nonsemantically simulating p elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'radioSet',
    what: 'radio buttons not grouped into standard field sets',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'role',
    what: 'native-replacing explicit roles',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'secHeading',
    what: 'headings that violate the logical level order in their sectioning containers',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'styleDiff',
    what: 'style inconsistencies',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'targetSmall',
    what: 'buttons, inputs, and non-inline links smaller than 44 pixels wide and high',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'targetTiny',
    what: 'buttons, inputs, and non-inline links smaller than 24 pixels wide and high',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'textSem',
    what: 'semantically vague elements i, b, and/or small',
    launchRole: 'sharer',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'title',
    what: 'page title',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: false
  },
  {
    id: 'titledEl',
    what: 'title attributes on inappropriate elements',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'zIndex',
    what: 'non-default Z indexes',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'shoot1',
    what: 'second page screenshot',
    launchRole: 'owner',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'motion',
    what: 'motion without user request, measured across tests',
    launchRole: 'sharer',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'buttonMenu',
    what: 'nonstandard keyboard navigation between items of button-controlled menus',
    launchRole: 'waster',
    timeOut: 15,
    defaultOn: true
  },
  {
    id: 'elements',
    what: 'data on specified elements',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: false
  },
  {
    id: 'focAll',
    what: 'discrepancies between focusable and Tab-focused elements',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'focInd',
    what: 'missing and nonstandard focus indicators',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'focOp',
    what: 'Tab-focusable elements that are not operable',
    launchRole: 'waster',
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'focVis',
    what: 'links that are not entirely visible when focused',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'hover',
    what: 'hover-caused content changes',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'hovInd',
    what: 'hover indication nonstandard',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'opFoc',
    what: 'operable elements that are not Tab-focusable',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'tabNav',
    what: 'nonstandard keyboard navigation between elements with the tab role',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'motionSolo',
    what: 'motion without user request, measured within this test',
    launchRole: 'waster',
    timeOut: 15,
    defaultOn: false
  },
  {
    id: 'textNodes',
    what: 'data on specified text nodes',
    launchRole: 'waster',
    timeOut: 10,
    defaultOn: false
  }
];
const headedBrowser = process.env.HEADED_BROWSER === 'true';
const debug = process.env.DEBUG === 'true';
const waits = Number.parseInt(process.env.WAITS) || 0;
const timeoutMultiplier = Number.parseFloat(process.env.TIMEOUT_MULTIPLIER) || 1;

// ERROR HANDLER
process.on('unhandledRejection', reason => {
  console.error(`ERROR: Unhandled Promise Rejection (${reason})`);
});

// FUNCTIONS

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
  return await getRuleResult(
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
  const act = report.acts[actIndex];
  const {args, stopOnFail, withItems} = act;
  const target = act.target || report.target;
  const url = target.url;
  const browserID = act.launch ? act.launch.browserID || report.browserID : report.browserID;
  const argRules = args ? Object.keys(args) : null;
  // Get the specification of rules to be tested for.
  const ruleSpec = act.rules
  || ['y', ... allRules.filter(rule => rule.defaultOn).map(rule => rule.id)];
  // Initialize the act data and result.
  const data = {
    prevented: false,
    error: '',
    rulePreventions: [],
    rulePreventionMessages: {},
    rulesInvalid: [],
    ruleTestTimes: {}
  };
  const result = {};
  const allRuleIDs = allRules.map(rule => rule.id);
  // If the rule specification is invalid:
  if (! (
    ruleSpec.length > 1
    && ['y', 'n'].includes(ruleSpec[0])
    && ruleSpec.slice(1).every(ruleID => allRuleIDs.includes(ruleID))
  )) {
    // Report this and stop testing.
    data.prevented = true;
    data.error = 'ERROR: Testaro rule specification invalid';
    console.log('ERROR: Testaro rule specification invalid');
    return {
      data,
      result
    };
  }
  // Wait 1 second to prevent out-of-order logging with granular reporting.
  await wait(1000);
  // Get the rules to be tested for and their execution order.
  const jobRuleIDs = ruleSpec[0] === 'y'
  ? ruleSpec.slice(1)
  : allRules.filter(rule => rule.defaultOn && ! allRuleIDs.includes(rule.id));
  const jobRules = allRules.filter(rule => jobRuleIDs.includes(rule.id));
  const testTimes = [];
  // For each rule to be tested for:
  for (const ruleIndexString in jobRules) {
    const ruleIndex = Number.parseInt(ruleIndexString);
    const rule = jobRules[ruleIndex];
    const ruleID = rule.id;
    console.log(`Starting rule ${ruleID}`);
    const headEmulation = ruleID.startsWith('shoot') ? 'high' : 'low';
    // Get whether it needs a new browser launched.
    const needsLaunch = ! ruleIndex
    && jobRules[ruleIndex - 1].launchRole !== 'sharer'
    && rule.launchRole !== 'owner'
    || ! ruleIndex;
    const pageClosed = page && page.isClosed();
    // If it does, or if the page has closed:
    if (needsLaunch || pageClosed) {
      // If the page has closed when it is expected to be open:
      if (pageClosed && ! needsLaunch) {
        // Report this.
        console.log(`WARNING: Relaunching browser for test ${rule} after abnormal closure`);
      }
      // Replace the browser and the page and navigate to the target.
      await launch(
        report,
        headEmulation,
        browserID,
        url
      );
      page = require('../run').page;
    }
    // Report crashes and disconnections during this test.
    let crashHandler;
    let disconnectHandler;
    // Get the current browser.
    const {browser} = require('../run');
    if (page && ! page.isClosed()) {
      crashHandler = () => {
        console.log(`ERROR: Page crashed during ${rule} test`);
      };
      page.on('crash', crashHandler);
    }
    if (browser) {
      disconnectHandler = () => {
        console.log(`ERROR: Browser disconnected during ${rule} test`);
      };
      browser.on('disconnected', disconnectHandler);
    }
    // Initialize an argument array for reporter or jsonTest.
    const ruleArgs = [page, withItems];
    const ruleFileNames = await fs.readdir(`${__dirname}/../testaro`);
    const isJS = ruleFileNames.includes(`${ruleID}.js`);
    const isJSON = ruleFileNames.includes(`${ruleID}.json`);
    // If the rule is defined with JavaScript or JSON but not both:
    if ((isJS || isJSON) && ! (isJS && isJSON)) {
      // If with JavaScript and it has extra arguments:
      if (isJS && argRules && argRules.includes(ruleID)) {
        // Add them to the argument array.
        ruleArgs.push(... args[ruleID]);
      }
      result[ruleID] ??= {};
      const {what} = rule;
      result[ruleID].what = what || '';
      const startTime = Date.now();
      let timeout;
      let testRetries = 2;
      let testSuccess = false;
      while (testRetries > 0 && ! testSuccess) {
        try {
          // Apply a time limit to the test.
          const timeLimit = 1000 * timeoutMultiplier * rule.timeOut;
          // If the time limit expires during the test:
          const timer = new Promise(resolve => {
            timeout = setTimeout(() => {
              // Add data about the test, including its prevention, to the result.
              const endTime = Date.now();
              testTimes.push([rule, Math.round((endTime - startTime) / 1000)]);
              data.rulePreventions.push(rule);
              data.rulePreventionMessages[ruleID] = 'Timeout';
              result[ruleID].totals = [0, 0, 0, 0];
              result[ruleID].standardInstances = [];
              console.log(`ERROR: Test of testaro rule ${ruleID} timed out`);
              resolve({timedOut: true});
            }, timeLimit);
          });
          // Perform the test, subject to the time limit.
          const ruleReport = isJS
            ? require(`../testaro/${ruleID}`).reporter(... ruleArgs)
            : jsonTest(ruleID, ruleArgs);
          // Get the test result or a timeout result.
          const ruleOrTimeoutReport = await Promise.race([timer, ruleReport]);
          // If the test was completed:
          if (! ruleOrTimeoutReport.timedOut) {
            // Add data from the test to the result.
            const endTime = Date.now();
            testTimes.push([ruleID, Math.round((endTime - startTime) / 1000)]);
            Object.keys(ruleOrTimeoutReport).forEach(key => {
              result[ruleID][key] = ruleOrTimeoutReport[key];
            });
            // If the result includes totals:
            if (result[ruleID].totals) {
              // Round them.
              result[ruleID].totals = result[ruleID].totals.map(total => Math.round(total));
            }
            // Prevent a retry of the test.
            testSuccess = true;
            // If testing is to stop after a failure and the page failed the test:
            if (
              stopOnFail
              && ruleOrTimeoutReport.totals
              && ruleOrTimeoutReport.totals.some(total => total)) {
              // Stop testing.
              break;
            }
          }
          // Otherwise, i.e. if the test timed out:
          else {
            // Stop retrying the test.
            break;
          }
        }
        // If an error is thrown by the test:
        catch(error) {
          const isPageClosed = ['closed', 'Protocol error', 'Target page'].some(phrase =>
            error.message.includes(phrase)
          );
          // If the page has closed and there are retries left:
          if (isPageClosed && testRetries) {
            // Report this and decrement the allowed retry count.
            console.log(
              `WARNING: Retry ${3 - testRetries--} of test ${ruleID} starting after page closed`
            );
            await wait(2000);
            // Replace the browser and the page in the run module and navigate to the target.
            await launch(
              report,
              headEmulation,
              report.browserID,
              url
            );
            page = require('../run').page;
            // If the page replacement failed:
            if (! page) {
              // Report this.
              console.log(`ERROR: Browser relaunch to retry test ${ruleID} failed`);
              data.rulePreventions.push(ruleID);
              data.rulePreventionMessages[ruleID] = 'Retry failure due to browser relaunch failure';
              // Stop retrying the test.
              break;
            }
            // Update the rule arguments with the current page.
            ruleArgs[0] = page;
          }
          // Otherwise, i.e. if the page is open or it is closed but no retries are left:
          else {
            // Treat the test as prevented.
            data.rulePreventions.push(ruleID);
            data.rulePreventionMessages[ruleID] = error.message;
            console.log(`ERROR: Test of testaro rule ${ruleID} prevented (${error.message})`);
            // Do not retry the test even if retries are left.
            break;
          }
        }
        finally {
          // Clear the timeout.
          clearTimeout(timeout);
        }
      }
      // Clear the error listeners.
      if (page && ! page.isClosed() && crashHandler) {
        page.off('crash', crashHandler);
        crashHandler = null;
      }
      if (browser && disconnectHandler) {
        browser.off('disconnected', disconnectHandler);
        disconnectHandler = null;
      }
    }
    // Otherwise, i.e. if the rule is undefined or doubly defined:
    else {
      // Report this.
      data.rulesInvalid.push(rule);
      console.log(`ERROR: Rule ${rule.id} not validly defined`);
      // Clear the crash listener.
      if (page && ! page.isClosed() && crashHandler) {
        page.off('crash', crashHandler);
        crashHandler = null;
      }
      if (browser && disconnectHandler) {
        browser.off('disconnected', disconnectHandler);
        disconnectHandler = null;
      }
    }
    // Force a garbage collection.
    try {
      if (global.gc) {
        global.gc();
      }
    }
    catch(error) {}
  };
  // Record the test times in descending order.
  testTimes.sort((a, b) => b[1] - a[1]).forEach(pair => {
    data.ruleTestTimes[pair[0]] = pair[1];
  });
  return {
    data,
    result
  };
};
