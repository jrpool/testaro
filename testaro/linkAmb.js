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
      const text = link.textContent.trim().toLowerCase();
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
    // Get the texts of violator links and the destination counts of the texts.
    const violationEntries = Object.entries(linkData).filter((entry => entry[1].hrefCount > 1));
    const textData = {};
    violationEntries.forEach(entry => {
      textData[entry[0]] = entry[1].hrefCount;
    });
    // Return the data.
    return textData;
  });
  // Get locators for all visible links.
  const linksLoc = page.locator('a[href]:visible');
  const linkLocs = await linksLoc.all();
  const violations = [];
  // For each of them:
  for (const loc of linkLocs) {
    const text = (await loc.textContent()).trim().toLowerCase();
    // If it is a violator:
    if (violationData[text]) {
      // Add the locator and a violation description to the array of violations.
      violations.push({
        loc,
        what: `${violationData[text]} links with the same text have different destinations`
      });
    }
  }
  // Get and return a result.
  const whats = 'Links have the same text but different destinations';
  return await getBasicResult(page, withItems, 'linkAmb', 2, 'LI', whats, {}, violations);
};
