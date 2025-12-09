/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
      const {tagName,id, location, excerpt} = elData;
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
  return await page.evaluate(args => {
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
    candidates.forEach(element => {
      const violationWhat = getBadWhat(element);
      // If it violates the rule:
      if (violationWhat) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          // Add an instance to the instances.
          instances.push(
            window.getInstance(element, ruleID, violationWhat, 1, severity)
          );
        }
      }
    });
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
