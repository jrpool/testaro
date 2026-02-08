/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  testaro
  Utilities for Testaro tests.
*/

// ########## IMPORTS

// Module to get locator data.
const {getLocatorData} = require('./getLocatorData');
// Module to get element IDs.
const {boxOf, boxToString} = require('./identify');
// Module to get XPath catalog index.
const {getXPathCatalogIndex} = require('./xPath');

// ########## FUNCTIONS

// Tests for a testaro rule.
exports.doTest = async (
  page,
  catalog,
  withItems,
  ruleID,
  candidateSelector,
  whats,
  severity,
  summaryTagName,
  getBadWhatString
) => {
  const ruleData = await page.evaluate(async args => {
    // Get the arguments (summaryTagName must be upper-case or null).
    const [
      withItems,
      ruleID,
      candidateSelector,
      whats,
      severity,
      summaryTagName,
      getBadWhatString
    ] = args;
    // Get all violator candidates.
    const candidates = document.body.querySelectorAll(candidateSelector);
    let violationCount = 0;
    // Initialize proto-instances.
    const protoInstances = [];
    // Parse the supplied string to get the classifier.
    const getBadWhat = eval(`(${getBadWhatString})`);
    // Initialize data on the rule.
    let data = {};
    const totals = [0, 0, 0, 0];
    // For each candidate:
    for (const candidate of candidates) {
      // Classify it as and get a violation description if a violator or undefined if not.
      const violationWhat = await getBadWhat(candidate);
      // If the candidate violates the rule:
      if (violationWhat) {
        // Increment the violation count.
        violationCount++;
        let ruleWhat;
        const violationType = typeof violationWhat;
        // If data on the violation were provided (unusual):
        if (violationType === 'object') {
          // Get the description and add the data to the rule data.
          ruleWhat = violationWhat.description;
          data[violationCount - 1] = violationWhat.data;
        }
        // Otherwise, i.e. if only a description of the violation was provided:
        else if (violationType === 'string') {
          // Get it.
          ruleWhat = violationWhat;
        }
        const ruleWhatStart = ruleWhat.slice(0, 2);
        let ordinalSeverity = severity;
        // If this violation has a custom severity:
        if (/[0-3]:/.test(ruleWhatStart)) {
          // Get it.
          ordinalSeverity = Number(ruleWhat[0]);
          // Remove it from the violation description.
          ruleWhat = ruleWhat.slice(2);
        }
        // Increment the applicable rule-violation total.
        totals[ordinalSeverity]++;
        // If itemization is required:
        if (withItems) {
          // Add a proto-instance to the proto-instances.
          protoInstances.push({
            what: ruleWhat,
            ordinalSeverity,
            pathID: window.getXPath(candidate)
          });
        }
      }
    }
    return {
      data,
      totals,
      protoInstances
    }
  }, [
      withItems,
      ruleID,
      candidateSelector,
      whats,
      severity,
      summaryTagName,
      getBadWhatString
    ]
  );
  // Initialize the standard instances.
  let standardInstances = [];
  // If itemization is required:
  if (withItems) {
    // For each proto-instance:
    ruleData.protoInstances.forEach(protoInstance => {
      const {what, ordinalSeverity, pathID} = protoInstance;
      // Initialize a standard instance.
      const standardInstance = {
        ruleID,
        what,
        ordinalSeverity,
        count: 1
      };
      // If the proto-instance includes an XPath:
      if (pathID) {
        // Use it to get the catalog index of the element.
        const catalogIndex = getXPathCatalogIndex(catalog, pathID);
        // If the acquisition succeeded:
        if (catalogIndex) {
          // Add the catalog index to the standard instance.
          standardInstance.catalogIndex = catalogIndex;
        }
        // Otherwise, i.e. if the acquisition failed:
        else {
          // Add the XPath to the standard instance as its path ID.
          standardInstance.pathID = pathID;
        }
      }
      // Add the standard instance to the standard instances.
      standardInstances.push(standardInstance);
    });
  }
  // Otherwise, i.e. if itemization is not required:
  else {
    const {totals} = ruleData;
    // For each ordinal severity:
    for (const index in totals) {
      // If there were any violations at that severity:
      if (totals[index]) {
        // Add a summary standard instance to the standard instances.
        standardInstances.push({
          ruleID,
          what: whats,
          ordinalSeverity: index,
          count: totals[index]
        });
      }
    }
  }
  // Return the data, totals, and standard instances.
  return {
    data,
    totals,
    standardInstances
  };
};
// Returns a result from a basic test.
exports.getBasicResult = async (
  page, withItems, ruleID, ordinalSeverity, summaryTagName, whats, data, violations
) => {
  // If the test was prevented:
  if (data.prevented) {
    // Return this.
    return {
      data,
      totals: [0, 0, 0, 0],
      standardInstances: []
    };
  }
  // Otherwise, i.e. if the test was not prevented:
  const totals = [0, 0, 0, 0];
  totals[ordinalSeverity] = violations.length;
  const standardInstances = [];
  // If itemization is required:
  if (withItems) {
    // For each violation:
    for (const violation of violations) {
      const {loc, what} = violation;
      const elData = await getLocatorData(loc);
      // Get the bounding box of the element.
      const {tagName, id, location, excerpt} = elData;
      const box = location.type === 'box' ? location.spec : await boxOf(loc);
      // Add a standard instance to the instances.
      standardInstances.push({
        ruleID,
        what,
        ordinalSeverity,
        tagName,
        id,
        location,
        excerpt,
        boxID: boxToString(box),
        pathID: tagName === 'HTML' ? '/html' : await xPath(loc)
      });
    }
  }
  // Otherwise, i.e. if itemization is not required:
  else {
    // Add a summary instance to the instances.
    standardInstances.push({
      ruleID,
      what: whats,
      ordinalSeverity,
      summaryTagName,
      id: '',
      location: {},
      excerpt: '',
      boxID: '',
      pathID: ''
    });
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
// Returns an awaited change in a visible element count.
exports.getVisibleCountChange = async (
  rootLoc, elementCount0, timeLimit = 400, settleInterval = 75
) => {
  const startTime = Date.now();
  let timeout;
  let settleChecker;
  let elementCount1 = elementCount0;
  // Set a time limit on the change.
  const timeoutPromise = new Promise(resolve => {
    timeout = setTimeout(() => {
      clearInterval(settleChecker);
      resolve();
    }, timeLimit);
  });
  // Until the time limit expires, periodically:
  const settlePromise = new Promise(resolve => {
    settleChecker = setInterval(async () => {
      const visiblesLoc = await rootLoc.locator('*:visible');
      // Get the count.
      elementCount1 = await visiblesLoc.count();
      // If the count has changed:
      if (elementCount1 !== elementCount0) {
        // Stop.
        clearTimeout(timeout);
        clearInterval(settleChecker);
        resolve();
      }
    }, settleInterval);
  });
  // When a change occurs or the time limit expires:
  await Promise.race([timeoutPromise, settlePromise]);
  const elapsedTime = Math.round(Date.now() - startTime);
  // Return the change.
  return {
    change: elementCount1 - elementCount0,
    elapsedTime
  };
};
// Annotates every element on a page with a unique identifier.
exports.addTestaroIDs = async page => {
  // Wait for the page to be fully loaded.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    let serialID = 0;
    for (const element of Array.from(document.querySelectorAll('*'))) {
      const xPath = window.getXPath(element);
      element.setAttribute('data-testaro-id', `${serialID++}#${xPath}`);
    }
  });
};
