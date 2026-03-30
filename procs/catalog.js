/*
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  catalog
  Creates and returns a catalog of a target.

  A catalog is an object with one property per element in the target. Each property has the element index as its key and has an object as its value, with 7 properties:
  - tagName
  - id
  - startTag
  - text
  - textLinkable
  - boxID
  - pathID
  - headingIndex
*/

// IMPORTS

// Module to close and launch browsers.
const {browserClose, launch} = require('./launch');
const {getXPathCatalogIndex} = require('./xPath');

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
      // Get a catalog of the elements in the page.
      const catalog = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        // Initialize a catalog.
        const cat = {};
        // Initialize a directory of text fragments.
        const texts = {};
        // Initialize the index of the current heading.
        let headingIndex = '';
        // For each element in the page:
        for (const index in elements) {
          const element = elements[index];
          // Get its ID and tag name.
          const {id, tagName} = element;
          // Get its start tag.
          const startTag = element.outerHTML?.replace(/^.*?</s, '<').replace(/>.*$/s, '>') ?? '';
          // Get whether it is eligible for text-fragment acquisition.
          const isTextable = element.closest('body')
          && ! element.closest('svg')
          && ! ['SCRIPT', 'STYLE', 'svg'].includes(element.tagName);
          const innerText = isTextable
          ? element.innerText.trim() || (element.parentElement?.innerText?.trim() ?? '')
          : '';
          let text = '';
          // If it is eligible and has an inner text:
          if (innerText) {
            const segments = innerText?.split('\n') ?? [];
            const tidySegments = segments.map(segment => segment.trim().replace(/\s+/g, ' '));
            const neededSegments = tidySegments.filter(segment => segment.length);
            neededSegments.splice(1, neededSegments.length - 2);
            // Get its text fragments.
            text = neededSegments.join('\n');
            // Add its index to the directory of text fragments.
            texts[text] ??= [];
            texts[text].push(index);
          }
          const domRect = element.getBoundingClientRect();
          // Get its box ID.
          const boxID = domRect
          ? ['x', 'y', 'width', 'height'].map(key => Math.round(domRect[key])).join(':')
          : '';
          // Get its path ID.
          const pathID = window.getXPath(element);
          // If it is a heading that nullifies an existing current heading index:
          if (
            headingIndex
            && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)
            && cat[headingIndex].tagName >= tagName
          ) {
            // Nullify the current heading index.
            headingIndex = '';
          }
          // Add an entry for it to the catalog.
          cat[index] = {
            tagName,
            id: id || '',
            startTag,
            text,
            textLinkable: false,
            boxID,
            pathID,
            headingIndex
          };
          // If the element is a heading:
          if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
            // Assign its index to the current heading index.
            headingIndex = index;
          }
          // If the element has a path ID:
          if (pathID) {
            // Add it to the temporary path ID directory in the catalog.
            cat.pathID ??= {};
            cat.pathID[pathID] = index;
          }
        }
        // For each text in the catalog:
        Object.keys(texts).forEach(text => {
          const textElementIndexes = texts[text].sort((a, b) => Number(a) - Number(b));
          // If every element that has it is in the same subtree, so the text is page-unique:
          if (
            textElementIndexes.slice(0, -1).every(
              (elementIndex, index) => cat[textElementIndexes[index + 1]]
              .pathID
              .startsWith(cat[elementIndex].pathID)
            )
          ) {
            // For each element that has it:
            textElementIndexes.forEach(index => {
              // If it is not in the head, a script, a style, or a noscript element:
              if (
                ! ['/head[1]', '/script[', '/style[', '/noscript[']
                .some(excluder => cat[index].pathID.includes(excluder))
              ) {
                // Mark it as linkable in the element data in the catalog.
                cat[index].textLinkable = true;
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
// Prunes a catalog.
exports.pruneCatalog = report => {
  const {acts, catalog} = report;
  const citedElementIndexes = new Set();
  // For each act in the report:
  acts.forEach(act => {
    // If it is a test with a standard result:
    if (act.type === 'test' && act.result?.standardResult) {
      const {instances} = act.result.standardResult;
      // For each instance of the standard result:
      instances.forEach(instance => {
        const {catalogIndex} = instance;
        // If the instance has a catalog index:
        if (catalogIndex) {
          // Ensure the index is classified as cited.
          citedElementIndexes.add(catalogIndex);
          const {headingIndex} = catalog[catalogIndex];
          // If the catalog item has a heading index:
          if (headingIndex) {
            // Ensure it, too, is classified as cited.
            citedElementIndexes.add(headingIndex);
          }
        }
      });
    }
  });
  // Delete the temporary path ID property.
  delete catalog.pathID;
  // For each element in the catalog:
  Object.keys(catalog).forEach(elementIndex => {
    // If it is not cited by any instance or by any cited element:
    if (! citedElementIndexes.has(elementIndex)) {
      // Delete it in the catalog.
      delete catalog[elementIndex];
    }
  });
};
// Adds a catalog index or, if necessary, an XPath to a proto-instance.
exports.addCatalogIndex = async (protoInstance, locator, catalog) => {
  // Get the XPath of the element referenced by the locator.
  const xPath = await locator.evaluate(element => window.getXPath(element));
  // If the acquisition succeeded:
  if (xPath) {
    // Get the catalog index of the element.
    const catalogIndex = getXPathCatalogIndex(catalog, xPath);
    // If the acquisition succeeded:
    if (catalogIndex) {
      // Add it to the proto-instance.
      protoInstance.catalogIndex = catalogIndex;
    }
    // Otherwise, i.e. if the acquisition failed:
    else {
      // Add the XPath to the proto-instance.
      protoInstance.pathID = xPath;
    }
  }
  // Return the proto-instance with any modification.
  return protoInstance;
};
