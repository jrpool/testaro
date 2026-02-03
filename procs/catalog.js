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
        // Adds an element property to a catalog.
        const addToCatalog = (elementIndex, catalog, propertyName, value) => {
          if (value) {
            catalog[propertyName] ??= {};
            catalog[propertyName][value] ??= [];
            catalog[propertyName][value].push(elementIndex);
          }
        };
        const elements = Array.from(document.querySelectorAll('*'));
        // Initialize a catalog.
        const cat = {
          element: [],
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
          addToCatalog(
            index,
            cat,
            'startTag',
            element.outerHTML?.replace(/^.*?</s, '<').replace(/>.*$/s, '>') ?? ''
          );
          const innerText = element.closest('head') ? '' : element.innerText;
          const segments = innerText?.trim().split('\n');
          const tidySegments = segments?.map(segment => segment.trim().replace(/\s+/g, ' ')) ?? [];
          const neededSegments = tidySegments.filter(segment => segment.length);
          neededSegments.splice(1, neededSegments.length - 2);
          const text = neededSegments.join('⁋');
          addToCatalog(index, cat, 'text', text);
          const boxID = element.getBoundingClientRect();
          addToCatalog(
            index,
            cat,
            'boxID',
            boxID ? ['x', 'y', 'width', 'height'].map(key => boxID[key]).join(':') : ''
          );
          addToCatalog(index, cat, 'pathID', window.getXPath(element));
        }
        // For each path ID in the catalog:
        Object.keys(cat.pathID).forEach(pathID => {
          // Add it to the element data in the catalog.
          cat.element[cat.pathID[pathID][0]] = {pathID};
        });
        // For each text in the catalog:
        Object.keys(cat.text).forEach(text => {
          const textElementIndexes = cat.text[text];
          // If every element that has it is in the same subtree, so is page-unique:
          if (
            textElementIndexes.slice(0, -1).every(
              (elementIndex, index) => cat
              .element[textElementIndexes[index + 1]]
              .pathID
              .startsWith(cat.element[elementIndex].pathID)
            )
          ) {
            // For each element that has it:
            textElementIndexes.forEach(index => {
              // If it is not in the head:
              if (! cat.element[index].pathID.includes('/head[1]')) {
                // Add it to the element data in the catalog.
                cat.element[index].text = text;
              }
            });
          }
        });
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
