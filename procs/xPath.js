/*
  © 2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  xPath.js
  Processes element XPaths.
*/

// FUNCTIONS

// Normalizes an XPath.
exports.getNormalizedXPath = xPath => {
  if (xPath) {
    if (xPath === '/') {
      xPath = '/html';
    }
    xPath = xPath.replace(/^\.\/\//, '/');
    const segments = xPath.split('/');
    // Initialize an array of normalized segments.
    const normalizedSegments = [];
    // For each segment of the XPath:
    segments.forEach(segment => {
      // If the segment is html[1] or body[1]:
      if (/html\[1\]|body\[1\]/.test(segment)) {
        // Add it without its subscript to the array.
        normalizedSegments.push(segment.replace(/\[1\]/, ''));
      }
      // Otherwise, if the segment is empty or html or body or ends with a subscript:
      else if (segment === '' || ['html', 'body'].includes(segment) || segment.endsWith(']')) {
        // Add it to the array.
        normalizedSegments.push(segment);
      }
      // Otherwise, i.e. if the segment is a tag name with no subscript:
      else {
        // Add it with a subscript 1 to the array.
        normalizedSegments.push(`${segment}[1]`);
      }
    });
    // Return the concatenated segments as the normalized XPath.
    return normalizedSegments.join('/');
  }
  else {
    return '';
  }
};
// Gets an XPath from a data-xpath attribute in an HTML excerpt.
exports.getAttributeXPath = html => {
  const match = html.match(/ data-xpath="([^" ]+)"/);
  return match ? match[1] : '';
};
// Gets a catalog index as a string from an XPath.
exports.getXPathCatalogIndex = (catalog, xPath) => {
  const index = catalog.pathID[xPath]?.[0] ?? '';
  return index;
};
// Gets a locator from an XPath. (Normalize this identifier if ever called, or delete.)
exports.getLocatorFromXPathXXX = async (page, xPath) => {
  // Get an XPath specifier.
  const specifier = `xpath=${xPath}`;
  // Use it to get a Playwright locator.
  const locators = page.locator(specifier);
  // Get the count of its referents.
  const locatorCount = await locators.count();
  // If the specifier is valid and the count is 1:
  if (locatorCount === 1) {
    // Return the locator.
    return locators;
  }
  // Otherwise, i.e. if the specifier is invalid or does not have exactly 1 referent:
  else {
    // Return this.
    return null;
  }
};
// Annotates every element on a page with its XPath.
exports.addXPathsXXX = async page => {
  // Wait for the page to be fully loaded.
  await page.waitForLoadState('networkidle', {timeout: 10000});
  await page.evaluate(() => {
    // For each element:
    for (const element of Array.from(document.querySelectorAll('*'))) {
      const xPath = window.getXPath(element);
      // Add its XPath as an attribute to the element.
      element.setAttribute('data-xpath', xPath);
    }
  });
};
