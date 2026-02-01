/*
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  catalog
  Creates and returns a catalog of a target.
*/

// IMPORTS

// Module to close and launch browsers.
const {browserClose, launch} = require('./launch');

// FUNCTIONS

// Adds an element property to a catalog.
const addToCatalog = (elementIndex, catalog, propertyName, value) => {
  catalog[propertyName] ??= {};
  catalog[propertyName][value] ??= [];
  catalog[propertyName][value].push(elementIndex);
};
// Creates and returns a catalog.
exports.getCatalog = async report => {
  const {browserID} = report;
  const targetURL = report.target?.url;
  // If the report specifies a global browser ID and a global target URL:
  if (browserID && targetURL) {
    // Launch a browser, navigate to the target, and get the resulting page.
    const page = await launch({
      report,
      actIndex: null,
      tempBrowserID: browserID,
      tempURL: targetURL
    });
    // If the launch and navigation succeeded:
    if (page) {
      // Create a catalog of the elements in the page.
      const catalog = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        // Initialize a catalog.
        const cat = {
          tagName: {},
          id: {},
          startTag: {},
          text: {},
          boxID: {},
          pathID: {}
        };
        // For each element in the page:
        for (const index in elements) {
          const element = elements[index];
          // Add its properties to the catalog.
          addToCatalog(index, cat, 'tagName', element.tagName || '');
          addToCatalog(index, cat, 'id', element.id || '');
          addToCatalog(index, cat, 'startTag', element.outerHTML?.replace(/>.*$/, '>') || '');
          const {innerText} = element;
          const segments = innerText?.trim().split('\n');
          const tidySegments = segments.map(segment => segment.trim().replace(/\s+/g, ' '));
          const text = tidySegments.filter(segment => segment.length).join('⁋');
          addToCatalog(index, cat, 'text', text);
          const box = element.getBoundingClientRect();
          addToCatalog(index, cat, 'boxID', box ? Object.values(box).join(':') : '');
          addToCatalog(index, cat, 'pathID', window.getXPath(element));
        }
        return cat;
      });
      // Close the browser and its context.
      await browserClose(page);
      // Return the catalog.
      return catalog;
    }
    // Otherwise, i.e. if the launch or navigation failed, report and return this.
    console.log('ERROR: Launch or navigation failure prevented catalog creation');
    return {};
  }
  // Otherwise, i.e. if the report specification is incomplete, report and return this.
  console.log('ERROR: Job omits browser ID or target URL, preventing catalog creation');
  return {};
};
