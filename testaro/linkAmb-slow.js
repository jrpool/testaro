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

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const violationData = await page.evaluate(() => {
    const allLinks = Array.from(document.body.getElementsByTagName('a'));
    const visibleLinks = allLinks.filter(link => link.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    }));
    const tally = {};
    // For each visible link on the page:
    visibleLinks.forEach(link => {
      // Get its trimmed and lowercased text.
      const text = link.textContent.trim().toLowerCase();
      tally[text] ??= {
        linkCount: 0,
        hrefCount: 0,
        hrefs: {}
      };
      const href = link.getAttribute('href');
      // Add its data to the tally.
      tally[text].linkCount++;
      if (! tally[text].hrefs[href]) {
        tally[text].hrefCount++;
        tally[text].hrefs[href] = true;
      }
    });
    // Get the violation entries ([text, tally[text]]) from the tally.
    const violationEntries = Object.entries(tally).filter((entry => entry[1].hrefCount > 1));
    const data = {};
    // Get violation data ({text: {linkCount, hrefCount}}) from the violation entries.
    violationEntries.forEach(entry => {
      data[entry[0]] = {
        linkCount: entry[1].linkCount,
        hrefCount: entry[1].hrefCount,
      };
    });
    // Return the data.
    return data;
  });
  const violations = [];
  // For each violating text:
  for (const text of Object.keys(violationData)) {
    // Get locators for visible links containing at least it.
    const textPlusLinksLoc = await page.locator('a[href]:visible', {hasText: text});
    const textPlusLinksLocs = await textPlusLinksLoc.all();
    // For each of those locators:
    for (const loc of textPlusLinksLocs) {
      const locText = await loc.textContent();
      // If the trimmed and lowercased text content of its link is the violating text:
      if (locText.trim().toLowerCase() === text) {
        // Add the locator and a violation description to the violations.
        violations.push({
          loc,
          what: `${violationData[text].linkCount} links with this text have ${violationData[text].hrefCount} different destinations`
        });
      }
    }
  }
  // Get and return a result.
  const whats = 'Links have the same text but different destinations';
  return await getBasicResult(page, withItems, 'linkAmb', 2, 'A', whats, {}, violations);
};
