/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  linkAmb
  Related to Tenon rule 98.
  This test reports text contents that are shared by links with distinct destinations.
  Text contents are compared case-insensitively.
*/

// IMPORTS

// Module to perform common operations.
const {getBasicResult} = require('../procs/testaro');

// FUNCTIONS

// Gets a violation description.
const getViolationDescription = (text, count) =>
  `${count} links have the same text (${text}) but not all have the same destination`;
// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const violationData = await page.evaluate(() => {
    const allLinks = Array.from(document.body.getElementsByTagName('li'));
    const visibleLinks = allLinks.filter(link => link.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    }));
    const linkData = {};
    // For each visible link on the page:
    visibleLinks.forEach(link => {
      const text = link.textContent.trim();
      linkData[text] ??= {
        linkCount: 0,
        hrefCount: 0,
        hrefs: {}
      };
      const href = link.getAttribute('href');
      // Tally its text and destination.
      linkData[text].linkCount++;
      if (! linkData[text].hrefs[href]) {
        linkData[text].hrefCount++;
        linkData[text].hrefs[href] = true;
      }
    });
    // Get data on texts shared by links that have at least 2 different destinations.
    const violationEntries = Object.entries(linkData).filter((entry => entry[1].hrefCount > 1));
    violationEntries.forEach(entry => {
      const text = entry[0];
      const data = entry[1];

    })

    .map(([text, data]) => page.locator(`a:text("${text}")`));
  });
  const allLocs = Object.entries(violationData).filter(([text, hrefs]) => Object.keys(hrefs).length > 1).map(([text, hrefs]) => page.locator(`a:text("${text}")`));
  const violations = [];
  const data = {};
  // For each locator:
  for (const loc of allLocs) {
    // Get the XPath of the element referenced by the locator.
    let xPath = await loc.evaluate(element => getXPath(element));
    const pathSegments = xPath.split('/');
    const {length} = pathSegments;
    // Change it to the XPath of the desired observation root.
    pathSegments.pop();
    if (! ['main', 'body'].includes(pathSegments[length - 2])) {
      pathSegments.pop();
    }
    xPath = pathSegments.join('/');
    // Get a locator for the observation root.
    const rootLoc = page.locator(`xpath=${xPath}`);
    const loc0 = await rootLoc.locator('*:visible');
    // Get a count of the visible elements in the observation tree.
    const elementCount0 = await loc0.count();
    try {
      // Hover over the element.
      await loc.hover({timeout: 400});
      // Get the change in the count of the visible elements in the observation tree.
      const changeData = await getVisibleCountChange(rootLoc, elementCount0, 400, 75);
      const {change, elapsedTime} = changeData;
      // If a change occurred:
      if (change) {
        // Add the locator and a violation description to the array of violations.
        violations.push({
          loc,
          what: getViolationDescription(change, elapsedTime)
        });
      }
      // Stop hovering over the element.
      await page.mouse.move(0, 0);
      // Await a reverse change in the count of the visible elements in the observation tree.
      await getVisibleCountChange(rootLoc, elementCount0 + change);
    }
    // If hovering throws an error:
    catch(error) {
      // Report that the test was prevented.
      data.prevented = true;
      data.error = `ERROR hovering over an element (${error.message})`;
      break;
    }
  }
  // Get and return a result.
  const whats = 'Hovering over elements changes the number of related visible elements';
  return await getBasicResult(page, withItems, 'hover', 0, '', whats, data, violations);
};

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'a[href]:visible');
  const linksData = [];
  // For each locator:
  for (const loc of all.allLocs) {
    // Get its text.
    const elData = await getLocatorData(loc);
    const linkText = elData.excerpt.toLowerCase();
    // Get its destination.
    const linkTo = await loc.getAttribute('href');
    // If the text and destination exist:
    if (linkText && linkTo) {
      // If a previous link has the same text but a different destination:
      if (linksData.some(linkData => linkData.text === linkText && linkData.to !== linkTo)) {
        // Add the locator to the array of violators.
        all.locs.push(loc);
      }
      // Otherwise, i.e. if no previous link has the same taxt but a different destination:
      else {
        // Record its text and destination.
        linksData.push({
          text: linkText,
          to: linkTo
        });
      }
    }
  }
  // Populate and return the result.
  const whats = [
    'Link has the same text as, but a different destination from, another',
    'Links have the same texts but different destinations'
  ];
  return await getRuleResult(withItems, all, 'linkAmb', whats, 2);
};
