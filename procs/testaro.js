/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  testaro
  Utilities for Testaro tests.
*/

// ########## IMPORTS

// Function to add a catalog index to a standard instance.
const {addCatalogIndex} = require('./catalog');
// Function to get a catalog index from an XPath.
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
  getBadWhatString
) => {
  const ruleData = await page.evaluate(async args => {
    // Get the arguments.
    const [
      withItems,
      candidateSelector,
      severity,
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
      candidateSelector,
      severity,
      getBadWhatString
    ]
  );
  // Initialize the standard instances.
  let standardInstances = [];
  const {data, totals, protoInstances} = ruleData;
  // If itemization is required:
  if (withItems) {
    // For each proto-instance:
    protoInstances.forEach(protoInstance => {
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
// Tests for a doTest-ineligible Testaro rule.
exports.getBasicResult = async (
  catalog, withItems, ruleID, ordinalSeverity, whats, data, violations
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
      // Initialize a standard instance.
      const protoInstance = {
        ruleID,
        what,
        ordinalSeverity,
        count: 1
      };
      // Add a catalog index or path ID to it.
      addCatalogIndex(protoInstance, loc, catalog);
      // Add the standard instance to the standard instances.
      standardInstances.push(protoInstance);
    }
  }
  // Otherwise, i.e. if itemization is not required:
  else {
    // Add a summary instance to the instances.
    standardInstances.push({
      ruleID,
      what: whats,
      ordinalSeverity,
      count: violations.length
    });
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
