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
const getCatalog = async report => {
const {browserID} = report;
const targetURL = report.target.url;
  // Launch a browser and navigate to the target, and get the resulting page.
  const page = await launch(report, null, browserID, targetURL);
  // If the launch and navigation succeeded:
  if (page) {
    // Create a catalog of the elements in the page.
    const catalog = await page.evaluate(() => {
      // Initialize a catalog.
      const catalog = {
        tagName: {},
        id: {},
        startTag: {},
        text: {},
        boxID: {},
        pathID: {}
      };
      const elements = document.querySelectorAll('*');
      // For each element in the page:
      for (const element of elements) {
        const tagName = element ?? '';
        const id = element.id ?? '';
        const startTag = element.outerHTML.replace(/>.*$/, '>');
        const text = element
        .innerText
        .trim()
        .split('\n')
        .map(line => line.trim().replace(/\s+/g, ' '))
        .filter(line => line.length);
        const box = element.getBoundingClientRect();
        const boxID = box ? Object.values(box).join(':') : '';
        const pathID = window.getXPath(element);
        // TODO: Process the element to create the catalog.
      }
      // TODO: Process the elements to create the catalog.
      return catalog;
    });
    // TODO: Process the elements to create the catalog.
  }
  // TODO: Get the catalog.
  // Close the browser.
  await browserClose();
  // Return the catalog.
  return {};
};
