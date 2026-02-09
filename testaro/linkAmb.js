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
  This test reports text contents that are shared by links with distinct destinations. Text contents are compared case-insensitively.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, catalog, withItems) => {
  return await page.evaluate(withItems => {
    // Get all links.
    const allLinks = Array.from(document.body.getElementsByTagName('a'));
    // Get the visible ones.
    const visibleLinks = allLinks.filter(link => link.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    }));
    // Initialize the data.
    const linksData = {
      elementData: [],
      textTotals: {}
    };
    // For each visible link:
    visibleLinks.forEach(element => {
      // Get its trimmed and lowercased text.
      const text = element.textContent.trim().toLowerCase();
      // Get its destination.
      const href = element.getAttribute('href');
      // Add to the data.
      linksData.elementData.push([text, href]);
      linksData.textTotals[text] ??= {
        linkCount: 0,
        hrefs: new Set()
      };
      const linkData = linksData.textTotals[text];
      linkData.linkCount++;
      linkData.hrefs.add(href);
    });
    let violationCount = 0;
    const standardInstances = [];
    // For each link text:
    for (const [text, {linkCount, hrefs}] of Object.entries(linksData.textTotals)) {
      const destinationCount = hrefs.size;
      // If links with it violate the rule:
      if (destinationCount > 1) {
        // Increment the violation count.
        violationCount += linkCount;
        // If itemization is required:
        if (withItems) {
          const what = `${linkCount} links with the text “${text}” have ${destinationCount} different destinations`;
          // Add an instance to the standard instances.
          standardInstances.push({
            ruleID: 'linkAmb',
            what,
            ordinalSeverity: 2,
            count: linkCount
          });
        }
      }
    }
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'Links have the same text but different destinations';
      // Add a summary instance to the instances.
      standardInstances.push({
        ruleID: 'linkAmb',
        what,
        ordinalSeverity: 2,
        count: violationCount
      });
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      standardInstances: instances
    };
  }, withItems);
};
