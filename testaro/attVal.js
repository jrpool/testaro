/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  attVal
  This test reports elements with illicit values of an attribute.
*/

// IMPORTS

const {getXPathCatalogIndex} = require('../procs/xPath');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems, attributeName, areLicit, values) => {
  // Return totals and standard instances for the rule.
  const protoResult = await page.evaluate(args => {
    const [withItems, attributeName, areLicit, values] = args;
    // Get all candidates, i.e. elements with the attribute.
    const candidates = document.body.querySelectorAll(`[${attributeName}]`);
    let violationCount = 0;
    const protoInstances = [];
    // For each candidate:
    candidates.forEach(element => {
      const value = element.getAttribute(attributeName);
      // If it violates the rule:
      if (areLicit !== values.includes(value)) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = `Element has attribute ${attributeName} with illicit value ${value}`;
          // Add a proto-instance to the proto-instances.
          protoInstances.push(window.getProtoInstance(element, 'attVal', what, 1, 2));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = `Elements have attribute ${attributeName} with illicit values`;
      // Add a summary instance to the proto-instances.
      protoInstances.push(window.getProtoInstance(null, 'attVal', what, violationCount, 2));
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      protoInstances
    };
  }, [withItems, attributeName, areLicit, values]);
  // If itemization is required:
  if (withItems) {
    // For each proto-instance:
    protoResult.protoInstances.forEach(protoInstance => {
      // If it includes a path ID:
      if (protoInstance.pathID) {
        // Use it to get a catalog index.
        const catalogIndex = getXPathCatalogIndex(catalog, protoInstance.pathID);
        // If the acquisition succeeded:
        if (catalogIndex) {
          // Replace the path ID with the catalog index.
          delete protoInstance.pathID;
          protoInstance.catalogIndex = catalogIndex;
        }
      }
    });
  }
  return {
    data: {},
    totals: protoResult.totals,
    instances: protoResult.protoInstances
  };
};
