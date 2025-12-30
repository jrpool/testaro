/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

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
const {getLocatorData} = require('../procs/getLocatorData');
// Module to get element IDs.
const {boxOf, boxToString} = require('./identify');
// Module to get the XPath of an element.
const {xPath} = require('playwright-dompath');

// ########## FUNCTIONS

// Performs a standard test.
exports.doTest = async (
  page,
  withItems,
  ruleID,
  candidateSelector,
  whats,
  severity,
  summaryTagName,
  getBadWhatString
) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(async args => {
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
    // Get all candidates.
    const candidates = document.body.querySelectorAll(candidateSelector);
    let violationCount = 0;
    const standardInstances = [];
    // Get a function that returns a violation description, if any, for the candidate.
    const getBadWhat = eval(`(${getBadWhatString})`);
    let data = {};
    const totals = [0, 0, 0, 0];
    // For each candidate:
    for (const candidate of candidates) {
      // Get the violation description, if any.
      const violationWhat = await getBadWhat(candidate);
      // If the candidate violates the rule:
      if (violationWhat) {
        // Increment the violation count.
        violationCount++;
        let ruleWhat;
        const violationType = typeof violationWhat;
        // If data on the violation were provided:
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
        // If itemization is required:
        if (withItems) {
          const ruleWhatStart = ruleWhat.slice(0, 2);
          let instanceSeverity = severity;
          // If this violation has a custom severity:
          if (/[0-3]:/.test(ruleWhatStart)) {
            // Get it.
            instanceSeverity = Number(ruleWhat[0]);
            // Remove it from the violation description.
            ruleWhat = ruleWhat.slice(2);
            // Increment the violation totals.
            totals[instanceSeverity]++;
          }
          // Add an instance to the instances.
          standardInstances.push(
            window.getInstance(candidate, ruleID, ruleWhat, 1, instanceSeverity)
          );
        }
        // Otherwise, i.e. if itemization is not required:
        else {
          // Increment the violation totals.
          totals[severity]++;
        }
      }
    }
    // If there are any violations and itemization is not required:
    if (violationCount && ! withItems) {
      // Add a summary instance to the instances.
      standardInstances.push(
        window.getInstance(null, ruleID, whats, violationCount, severity, summaryTagName)
      );
    }
    return {
      data,
      totals,
      standardInstances
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
  await page.evaluate(() => {
    let serialID = 0;
    for (const element of Array.from(document.querySelectorAll('*'))) {
      element.setAttribute('data-testaro-id', `${serialID++}#`);
    }
  });
};
// Returns location data from the extract of a standard instance.
exports.getLocationData = async (page, excerpt) => {
  const testaroIDArray = excerpt.match(/data-testaro-id="(\d+)#"/);
  // If the excerpt contains a Testaro identifier:
  if (testaroIDArray) {
    const testaroID = testaroIDArray[1];
    // Return location data for the element.
    return await page.evaluate(testaroID => {
      const element = document.querySelector(`[data-testaro-id="${testaroID}#"]`);
      // If any element has that identifier:
      if (element) {
        // Get box and path IDs for the element.
        const box = {};
        let boxID = '';
        const boundingBox = element.getBoundingClientRect() || {};
        if (boundingBox.x) {
          ['x', 'y', 'width', 'height'].forEach(coordinate => {
            box[coordinate] = Math.round(boundingBox[coordinate]);
          });
        }
        if (typeof box.x === 'number') {
          boxID = Object.values(box).join(':');
        }
        const pathID = window.getXPath(element) || '';
        // Return them.
        return {
          boxID,
          pathID
        };
      }
      // Otherwise, i.e. if no element has it, return empty location data.
      return {};
    }, testaroID);
  }
  // Otherwise, i.e. if the extract contains no Testaro identifier:
  else {
    // Return a non-DOM location.
    return {
      notInDOM: true,
      boxID: '',
      pathID: ''
    };
  }
};
