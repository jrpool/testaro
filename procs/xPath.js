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
    // If the final segment contains any nonstandard character:
    if (/[[^\]A-Za-z0-9]/.test(segments[segments.length - 1])) {
      // Remove it.
      normalizedSegments.pop();
    }
    // Return the concatenated segments as the normalized XPath.
    return normalizedSegments.join('/');
  }
  else {
    return '/html';
  }
};
// Gets an XPath from a data-xpath attribute in an HTML excerpt.
exports.getAttributeXPath = html => {
  const match = html.match(/ data-xpath="([^" ]+)"/);
  return match ? match[1] : '/html';
};
// Gets a tag name from an XPath.
const getXPathTagName = xPath => {
  return xPath.split('/').pop().replace(/\[.+/, '').toUpperCase();
};
// Gets a catalog index as a string from an XPath.
exports.getXPathCatalogIndex = (catalog, xPath) => {
  // Get the index of the catalog item with the XPath.
  const index = catalog.pathID[xPath];
  // If no such item exists:
  if (! index) {
    // Add an item to the catalog.
    const newIndex = Object.keys(catalog).length;
    catalog[newIndex] = {
      pathID: xPath,
      tagName: getXPathTagName(xPath)
    };
    catalog.pathID[xPath] = `${newIndex}`;
    return newIndex;
  }
  return index;
};
