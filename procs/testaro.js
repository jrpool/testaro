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

// Module to sample a population.
const {getSample} = require('../procs/sample');
// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');
// Module to get element IDs.
const {boxOf, boxToString} = require('./identify');
// Module to get the XPath of an element.
const {xPath} = require('playwright-dompath');

// ########## FUNCTIONS

// Initializes violation locators and a result and returns them in an object.
const init = exports.init = async (sampleMax, page, locAllSelector, options = {}) => {
  // Get locators for the specified elements.
  const locPop = page.locator(locAllSelector, options);
  const locPops = await locPop.all();
  const populationSize = locPops.length;
  const sampleSize = Math.min(sampleMax, populationSize);
  const locIndexes = getSample(locPops, sampleSize);
  const allLocs = locIndexes.map(index => locPops[index]);
  const result = {
    data: {
      populationSize,
      sampleSize,
      populationRatio: sampleSize ? populationSize / sampleSize : null
    },
    totals: [0, 0, 0, 0],
    standardInstances: []
  };
  // Return the result.
  return {
    allLocs,
    locs: [],
    result
  };
};

// Populates and returns a result.
const getRuleResult = exports.getRuleResult = async (
  withItems, all, ruleID, whats, ordinalSeverity, tagName = ''
) => {
  const {locs, result} = all;
  const {data, totals, standardInstances} = result;
  // For each violation locator:
  for (const locItem of locs) {
    // Get data on its element.
    let loc, whatParam;
    if (Array.isArray(locItem)) {
      loc = locItem[0];
      whatParam = locItem[1];
    }
    else {
      loc = locItem;
    }
    const elData = await getLocatorData(loc);
    // Increment the totals.
    totals[ordinalSeverity] += data.populationRatio;
    // If itemization is required:
    if (withItems) {
      // Get the bounding box of the element.
      const {tagName, id, location, excerpt} = elData;
      const box = location.type === 'box' ? location.spec : await boxOf(loc);
      // Add a standard instance to the result.
      standardInstances.push({
        ruleID,
        what: whatParam ? whats[0].replace('__param__', whatParam) : whats[0],
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
  // If itemization is not required and any instances exist:
  if (! withItems && locs.length) {
    // Add a summary standard instance to the result.
    standardInstances.push({
      ruleID,
      what: whats[1],
      ordinalSeverity,
      count: Math.round(totals[ordinalSeverity]),
      tagName,
      id: '',
      location: {
        doc: '',
        type: '',
        spec: ''
      },
      excerpt: '',
      boxID: '',
      pathID: ''
    });
  }
  // Return the result.
  return result;
};
// Performs a simplifiable test.
exports.simplify = async (page, withItems, ruleData) => {
  const {
    ruleID, selector, pruner, complaints, ordinalSeverity, summaryTagName
  } = ruleData;
  // Get an object with initialized violation locators and result as properties.
  const all = await init(100, page, selector);
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element violates the rule.
    const isBad = await pruner(loc);
    // If it does:
    if (isBad) {
      // Add the locator of the element to the array of violation locators.
      all.locs.push(loc);
    }
  }
  // Populate and return the result.
  const whats = [
    complaints.instance,
    complaints.summary
  ];
  const result = await getRuleResult(
    withItems, all, ruleID, whats, ordinalSeverity, summaryTagName
  );
  // Return the result.
  return result;
};
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
    const instances = [];
    // Get a violation function.
    const getBadWhat = eval(`(${getBadWhatString})`);
    // For each candidate:
    for (const candidate of candidates) {
      const violationWhat = await getBadWhat(candidate);
      // If it violates the rule:
      if (violationWhat) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const violationWhatStart = violationWhat.slice(0, 2);
          let ruleSeverity = severity;
          let ruleWhat = violationWhat
          // If this violation has a custom severity:
          if (/[0-3]:/.test(violationWhatStart)) {
            // Get it and remove it from the violation description.
            ruleSeverity = Number(violationWhat[0]);
            ruleWhat = violationWhat.slice(2);
          }
          // Add an instance to the instances.
          instances.push(
            window.getInstance(candidate, ruleID, ruleWhat, 1, ruleSeverity)
          );
        }
      }
    }
    // If there are any violations and itemization is not required:
    if (violationCount && ! withItems) {
      // Add a summary instance to the instances.
      instances.push(
        window.getInstance(null, ruleID, whats, violationCount, severity, summaryTagName)
      );
    }
    return {
      data: {},
      totals: [0, 0, 0, violationCount],
      standardInstances: instances
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
