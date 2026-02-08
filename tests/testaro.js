/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  testaro
  This test implements the Testaro evaluative rules.
*/

// IMPORTS

// Function to launch a browser.
const {launch} = require('../procs/launch');

// CONSTANTS

/*
  Metadata of all rules in default execution order.
  launchRoles:
    sharer: rules that can run in parallel with other rules
    owner: rules that must run alone
*/
const allRules = [
  {
    id: 'shoot0',
    what: 'first page screenshot',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'adbID',
    what: 'elements with ambiguous or missing referenced descriptions',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'allCaps',
    what: 'leaf elements with entirely upper-case text longer than 7 characters',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'allHidden',
    what: 'page that is entirely or mostly hidden',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'allSlanted',
    what: 'leaf elements with entirely italic or oblique text longer than 39 characters',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'altScheme',
    what: 'img elements with alt attributes having URLs as their entire values',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'attVal',
    what: 'elements with attributes having illicit values',
    launchSharer: true,
    timeOut: 5,
    defaultOn: false
  },
  {
    id: 'dupAtt',
    what: 'duplicate attribute values',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'autocomplete',
    what: 'name and email inputs without autocomplete attributes',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'bulk',
    what: 'large count of visible elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'captionLoc',
    what: 'caption elements that are not first children of table elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'datalistRef',
    what: 'elements with ambiguous or missing referenced datalist elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'distortion',
    what: 'distorted text',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'docType',
    what: 'document without a doctype property',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'dupAtt',
    what: 'elements with duplicate attributes',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'embAc',
    what: 'active elements embedded in links or buttons',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'headEl',
    what: 'invalid elements within the head',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'headingAmb',
    what: 'same-level sibling headings with identical texts',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'hr',
    what: 'hr element instead of styles used for vertical segmentation',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'imageLink',
    what: 'links with image files as their destinations',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'labClash',
    what: 'labeling inconsistencies',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'legendLoc',
    what: 'legend elements that are not first children of fieldset elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'lineHeight',
    what: 'text with a line height less than 1.5 times its font size',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkAmb',
    what: 'links with identical texts but different destinations',
    launchSharer: true,
    timeOut: 20,
    defaultOn: true
  },
  {
    id: 'linkExt',
    what: 'links that automatically open new windows',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkOldAtt',
    what: 'links with deprecated attributes',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkTo',
    what: 'links without destinations',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'linkUl',
    what: 'missing underlines on inline links',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'miniText',
    what: 'text smaller than 11 pixels',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'nonTable',
    what: 'table elements used for layout',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'optRoleSel',
    what: 'Non-option elements with option roles that have no aria-selected attributes',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'phOnly',
    what: 'input elements with placeholders but no accessible names',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'pseudoP',
    what: 'adjacent br elements suspected of nonsemantically simulating p elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'radioSet',
    what: 'radio buttons not grouped into standard field sets',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'role',
    what: 'native-replacing explicit roles',
    launchSharer: true,
    timeOut: 20,
    defaultOn: true
  },
  {
    id: 'secHeading',
    what: 'headings that violate the logical level order in their sectioning containers',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'styleDiff',
    what: 'style inconsistencies',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'targetSmall',
    what: 'labels, buttons, inputs, and links too near each other',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'textSem',
    what: 'semantically vague elements i, b, and/or small',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'title',
    what: 'page title',
    launchSharer: true,
    timeOut: 5,
    defaultOn: false
  },
  {
    id: 'titledEl',
    what: 'title attributes on inappropriate elements',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'zIndex',
    what: 'non-default Z indexes',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'shoot1',
    what: 'second page screenshot',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'motion',
    what: 'motion without user request, measured across tests',
    launchSharer: true,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'buttonMenu',
    what: 'nonstandard keyboard navigation between items of button-controlled menus',
    launchSharer: false,
    timeOut: 15,
    defaultOn: true
  },
  {
    id: 'elements',
    what: 'data on specified elements',
    launchSharer: false,
    timeOut: 10,
    defaultOn: false
  },
  {
    id: 'focAll',
    what: 'discrepancies between focusable and Tab-focused elements',
    launchSharer: false,
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'focAndOp',
    what: 'Tab-focusable elements that are not operable or vice versa',
    launchSharer: false,
    timeOut: 5,
    defaultOn: true
  },
  {
    id: 'focInd',
    what: 'missing and nonstandard focus indicators',
    launchSharer: false,
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'focVis',
    what: 'links that are not entirely visible when focused',
    launchSharer: false,
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'hover',
    what: 'hover-caused content changes',
    launchSharer: false,
    timeOut: 20,
    defaultOn: true
  },
  {
    id: 'hovInd',
    what: 'hover indication nonstandard',
    launchSharer: false,
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'tabNav',
    what: 'nonstandard keyboard navigation between elements with the tab role',
    launchSharer: false,
    timeOut: 10,
    defaultOn: true
  },
  {
    id: 'textNodes',
    what: 'data on specified text nodes',
    launchSharer: false,
    timeOut: 10,
    defaultOn: false
  }
];
const timeoutMultiplier = Number.parseFloat(process.env.TIMEOUT_MULTIPLIER) || 1;

// ERROR HANDLER
process.on('unhandledRejection', reason => {
  console.error(`ERROR: Unhandled Promise Rejection (${reason})`);
});

// FUNCTIONS

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
  // Initialize the act report.
  const data = {
    prevented: false,
    error: '',
    rulePreventions: [],
    rulePreventionMessages: {},
    rulesInvalid: [],
    ruleTestTimes: {},
    ruleData: {}
  };
  const result = {
    nativeResult: {},
    standardResult: {
      prevented: false,
      totals: [0, 0, 0, 0],
      instances: []
    }
  };
  const {standardResult} = result;
  const {totals, instances} = standardResult;
  const allRuleIDs = allRules.map(rule => rule.id);
  // If the rule specification is invalid:
  if (! (
    ruleSpec.length > 1
    && ['y', 'n'].includes(ruleSpec[0])
    && ruleSpec.slice(1).every(ruleID => allRuleIDs.includes(ruleID))
  )) {
    // Report this and stop testing.
    standardResult.prevented = true;
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
    // Make the browser emulate headedness in all cases, because performance does not suffer.
    const headEmulation = ruleID.startsWith('shoot') ? 'high' : 'high';
    // Get whether it needs a new browser launched.
    const needsLaunch = ! (ruleIndex && jobRules[ruleIndex - 1].launchSharer);
    const pageClosed = page && page.isClosed();
    // If it does, or if the page has closed:
    if (needsLaunch || pageClosed) {
      // If the page has closed when it is expected to be open:
      if (pageClosed && ! needsLaunch) {
        // Report this.
        console.log(`WARNING: Relaunching browser for test ${rule} after abnormal closure`);
      }
      // Create a browser, replace the page, and navigate to the target.
      page = await launch({
        report,
        actIndex,
        tempBrowserID: browserID,
        tempURL: url
      });
    }
    // Report crashes and disconnections during this test.
    let crashHandler;
    let disconnectHandler;
    if (page && ! page.isClosed()) {
      crashHandler = () => {
        console.log(`ERROR: Page crashed during ${rule} test`);
      };
      page.on('crash', crashHandler);
    }
    const browser = page.context().browser();
    if (browser) {
      disconnectHandler = () => {
        console.log(`ERROR: Browser disconnected during ${rule} test`);
      };
      browser.on('disconnected', disconnectHandler);
    }
    // Initialize an argument array for the reporter.
    const ruleArgs = [page, report.catalog, withItems];
    // If the rule has extra arguments:
    if (argRules && argRules.includes(ruleID)) {
      // Add them to the argument array.
      ruleArgs.push(... args[ruleID]);
    }
    // Initialize the rule result.
    const ruleResult = {
      what: rule.what ?? ''
    };
    const startTime = Date.now();
    let timeout;
    let testRetries = 2;
    let testSuccess = false;
    // Until all permitted retries are exhausted or the test succeeds:
    while (testRetries > 0 && ! testSuccess) {
      try {
        // Apply a time limit to the test.
        const timeLimit = 1000 * timeoutMultiplier * rule.timeOut;
        // If the time limit expires during the test:
        const timer = new Promise(resolve => {
          timeout = setTimeout(() => {
            // Add data about the test, including its prevention, to the tool data and rule result.
            const endTime = Date.now();
            testTimes.push([rule, Math.round((endTime - startTime) / 1000)]);
            data.rulePreventions.push(ruleID);
            data.rulePreventionMessages[ruleID] = 'Timeout';
            ruleResult.totals = [0, 0, 0, 0];
            ruleResult.standardInstances = [];
            console.log(`ERROR: Test of testaro rule ${ruleID} timed out`);
            resolve({timedOut: true});
          }, timeLimit);
        });
        // Try to perform the test and get a rule report.
        const ruleReport = require(`../testaro/${ruleID}`).reporter(... ruleArgs);
        // Get the rule report, if completed, or a timeout report.
        const ruleOrTimeoutReport = await Promise.race([timer, ruleReport]);
        // If the test timed out:
        if (ruleOrTimeoutReport.timedOut) {
          // Report this.
          data.rulePreventions.push(ruleID);
          data.rulePreventionMessages[ruleID] = 'Timeout';
          // Stop retrying the test.
          break;
        }
        // Otherwise, i.e. if the test was completed:
        else {
          const endTime = Date.now();
          // Add the elapsed time of this test to the tool test times.
          testTimes.push([ruleID, Math.round((endTime - startTime) / 1000)]);
          // Add the rule report properties (usually data, totals, standardInstances)to the tool result.
          Object.keys(ruleOrTimeoutReport).forEach(key => {
            ruleResult[key] = ruleOrTimeoutReport[key];
          });
          // If the test was prevented:
          if (ruleResult.data?.prevented && ruleResult.data.error) {
            // Add this to the tool data.
            data.rulePreventions.push(ruleID);
            data.rulePreventionMessages[ruleID] = ruleResult.data.error;
          }
          // If the result includes totals:
          if (ruleResult.totals) {
            // Round them.
            ruleResult.totals = ruleResult.totals.map(total => Math.round(total));
          }
          const ruleDataMiscKeys = Object
          .keys(ruleResult.data)
          .filter(key => ! ['prevented', 'error'].includes(key));
          // For any other property of the rule report data object:
          ruleDataMiscKeys.forEach(key => {
            data.ruleData[ruleID] ??= {};
            // Add it to the tool data.
            data.ruleData[ruleID][key] = ruleResult.data[key];
          });
          // Prevent a retry of the test.
          testSuccess = true;
          // If testing is to stop after a failure and the page failed the test:
          if (stopOnFail && ruleResult.totals && ruleResult.totals.some(total => total)) {
            // Stop testing.
            break;
          }
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
            actIndex,
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
