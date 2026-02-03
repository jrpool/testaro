/*
  © 2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  identify.js
  Identifies the element of a standard instance.
*/

// IMPORTS

// Module to get the XPath of an element.
const {xPath} = require('playwright-dompath');

// FUNCTIONS

// Returns the bounding box of a locator.
const boxOf = exports.boxOf = async locator => {
  try {
    const isVisible = await locator.isVisible();
    if (isVisible) {
      const box = await locator.boundingBox({
        timeout: 100
      });
      if (box) {
        Object.keys(box).forEach(dim => {
          box[dim] = Math.round(box[dim], 0);
        });
        return box;
      }
      else {
        return null;
      }
    }
    else {
      return null;
    }
  }
  catch(error) {
    return null;
  }
}
// Returns a string representation of a bounding box.
const boxToString = exports.boxToString = box => {
  if (box) {
    return ['x', 'y', 'width', 'height'].map(dim => box[dim]).join(':');
  }
  else {
    return '';
  }
};
// Normalizes an XPath.
const getNormalizedXPath = exports.getNormalizedXPath = xPath => {
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
// Adds a box ID and a path ID to an object.
const addIDs = async (locator, recipient) => {
  const locatorCount = await locator.count();
  // If there is exactly 1 of them:
  if (locatorCount === 1) {
    // Add the box ID of the element to the result if none exists yet.
    if (! recipient.boxID) {
      const box = await boxOf(locator);
      recipient.boxID = boxToString(box);
    }
    // If the element has no path ID yet in the result:
    if (! recipient.pathID) {
      let timeout;
      const timer = new Promise(resolve => {
        timeout = setTimeout(() => {
          resolve({timedOut: true})
        }, 500);
      });
      // Use Playwright to get the XPath.
      const pathIDPromise = xPath(locator);
      const pathID = await Promise.race([pathIDPromise, timer]);
      // If the XPath was computed before being timed out:
      if (typeof pathID === 'string') {
        // Prevent the timeout from resolving.
        clearTimeout(timeout);
        // Add the XPath to the result.
        recipient.pathID = pathID;
      }
    }
    // Normalize the path ID.
    recipient.pathID = getNormalizedXPath(recipient.pathID);
  }
};
// Sanitizes a tag name.
const tagify = tagName => {
  if (tagName) {
    const lcTagName = tagName.toLowerCase();
    const safeTagName = lcTagName.replace(/[^a-z0-9]/g, '');
    if (safeTagName !== lcTagName) {
      console.log(`ERROR on page: Tag name ${tagName} invalid; treating it as ${safeTagName}`);
    }
    return safeTagName;
  }
  else {
    return '';
  }
};
// Returns the XPath and box ID of the element of a standard instance.
exports.identify = async (instance, page) => {
  // Initialize a result.
  const elementID = {
    boxID: '',
    pathID: ''
  };
  const {excerpt, id, location} = instance;
  const tagName = tagify(instance.tagName);
  const {type, spec} = location;
  // If the instance specifies a CSS selector or XPath location:
  if (['selector', 'xpath'].includes(type)) {
    let specifier = spec;
    // If the specified location is an XPath:
    if (type === 'xpath') {
      // Remove any final text-node segment.
      specifier = spec.replace(/\/text\(\)\[\d+\]$/, '');
    }
    // If any specifier remains:
    if (specifier) {
      if (type === 'xpath') {
        // Prefix it for playwright-dompath.
        specifier = `xpath=${specifier}`;
      }
      try {
        // Get a Playwright locator for it.
        const locators = page.locator(specifier);
        // Get the count of its referents.
        const locatorCount = await locators.count();
        // If the specifier is valid and the count is 1:
        if (locatorCount === 1) {
          // Add a box ID and a path ID to the result.
          await addIDs(locators, elementID);
        }
        /*
          Otherwise, if the specifier is invalid or the count is not 1, and the instance specifies
          an XPath location:
        */
        else if (type === 'xpath') {
          // Use the normalized XPath location as the path ID.
          elementID.pathID = getNormalizedXPath(specifier.replace(/^xpath=/, ''));
        }
      }
      // If the specifier is invalid:
      catch(error) {
        // Add this to the instance.
        instance.invalidity = {
          badProperty: 'location',
          validityError: error.message
        };
      }
    }
  }
  // If either ID remains undefined and the instance specifies an element ID:
  if (id && ! (elementID.boxID && elementID.pathID)) {
    // Get the first locator for an element with the ID.
    try {
      let locator = page.locator(`#${id.replace(/([-&;/]|^\d)/g, '\\$1')}`).first();
      // Add a box ID and a path ID to the result.
      await addIDs(locator, elementID);
    }
    // If the identifier is invalid:
    catch(error) {
      // Add this to the instance.
      instance.invalidity = {
        badProperty: 'id',
        validityError: error.message
      };
    }
  }
  // If either ID remains undefined and the instance specifies a tag name:
  if (tagName && ! (elementID.boxID && elementID.pathID)) {
    try {
      // Get locators for elements with the tag name.
      let locators = page.locator(tagName);
      // If there is exactly 1 of them:
      let locatorCount = await locators.count();
      if (locatorCount === 1) {
        // Add a box ID and a path ID to the result.
        await addIDs(locators, elementID);
      }
      // If either ID remains undefined and the instance also specifies an excerpt:
      if (excerpt && ! (elementID.boxID && elementID.pathID)) {
        // Get the plain text parts of the excerpt, converting ... to an empty string.
        const minTagExcerpt = excerpt.replace(/<[^>]+>/g, '<>');
        const plainParts = (minTagExcerpt.match(/[^<>]+/g) || [])
        .map(part => part === '...' ? '' : part);
        // Get the longest of them.
        const sortedPlainParts = plainParts.sort((a, b) => b.length - a.length);
        const mainPart = sortedPlainParts.length ? sortedPlainParts[0] : '';
        // If there is one:
        if (mainPart.trim().replace(/\s+/g, '').length) {
          // Get locators for elements with the tag name and the text.
          const locators = page.locator(tagName.toLowerCase(), {hasText: mainPart});
          // If there is exactly 1 of them:
          const locatorCount = await locators.count();
          if (locatorCount === 1) {
            // Add a box ID and a path ID to the result.
            await addIDs(locators, elementID);
          }
        }
      }
    }
    // If the tag name is invalid:
    catch(error) {
      // Add this to the instance.
      instance.invalidity = {
        badProperty: 'tagName',
        validityError: error.message
      };
    }
  }
  // Return the result.
  return elementID;
};
