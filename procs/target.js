/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  target
  Utilities for Testaro targetSmall and targetTiny tests.
*/

// ########## IMPORTS

// Module to classify links.
const {isInlineLink} = require('./isInlineLink');

// ########## FUNCTIONS

// Returns data about a target if it is displayed and illicitly small.
exports.isTooSmall = async (loc, min) => {
  let sizeData = null;
  // If the target is not an inline link:
  if (!(await isInlineLink(loc))) {
    // Get data on it if it is too small.
    sizeData = await loc.evaluate((el, min) => {
      // Get its styles.
      const styleDec = window.getComputedStyle(el);
      const displayStyle = styleDec.display;
      // If it is hidden (which should be impossible because of the selector):
      if (displayStyle === 'none') {
        // Exempt it.
        return null;
      }
      // Otherwise, i.e. if it is displayed:
      else {
        // Gets the width and height of an element.
        const getDims = el => {
          const rect = el.getBoundingClientRect();
          const widthR = rect && rect.width || 0;
          const heightR = rect && rect.height || 0;
          const widthP = el.offsetWidth || 0;
          const width = Math.max(widthP, Math.round(widthR));
          const heightP = el.offsetHeight || 0;
          const height = Math.max(heightP, Math.round(heightR));
          return [width, height];
        };
        const tagName = el.tagName;
        // Get the width and height of the target.
        const elDims = getDims(el);
        // If either dimension is too small:
        if (elDims.some(dim => dim < min)) {
          // Get the parent element of the target.
          const elParent = el.parentElement;
          // If the parent element exists:
          if (elParent) {
            // Get the child elements of the parent, including the target.
            const elGeneration = Array.from(elParent.children);
            // If the target has no siblings of its type:
            if (elGeneration.filter(peer => peer.tagName === tagName).length === 1) {
              // Get the width and height of the parent.
              const parentDims = getDims(elParent);
              // For each dimension of the target:
              elDims.forEach((elDim, index) => {
                // If it is too small and smaller than that of the parent:
                if (elDim < min && parentDims[index] > elDim) {
                  // Replace it with the dimension of the parent (a substitute for distance).
                  elDims[index] = parentDims[index];
                }
              });
            }
          }
          // Otherwise, i.e. if it does not exist:
          else {
            console.log(`WARNING: Target ${tagName} (${el.innerHTML}) has no parent element`);
          }
        }
        // Get whether it is too small.
        const isSmall = elDims.some(dim => dim < min);
        // Get its data if too small or its compliant status.
        return isSmall ? {tagName, width: elDims[0], height: elDims[1]} : null;
      }
    }, min);
  }
  // Return data about the target or its compliant status.
  return sizeData;
};
