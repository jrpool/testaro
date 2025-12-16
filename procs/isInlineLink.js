/*
  © 2023–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  isInlineLink
  Returns whether the link of a locator is inline.
  A link is classified as inline unless its declared or effective display is block.
*/

exports.isInlineLink = async loc => await loc.evaluate(element => {
  // Returns the normalized text content of an element.
  const realTextOf = element => element ? element.textContent.replace(/\s/g, '') : '';
  const blockElementTypes = 'p, div, li, h1, h2, h3, h4, h5, h6';
  // If the element is not a link:
  if (element.tagName !== 'A' && element.getAttribute('role') !== 'link') {
    // Classify it as not an inline link.
    return false;
  }
  // Otherwise, i.e. if it is a link:
  else {
    // Initialize the link as inline.
    let result = true;
    // If its display style property is block or is tantamount to block:
    if (
      window.getComputedStyle(element).display === 'block'
      || realTextOf(element.closest(blockElementTypes)) === realTextOf(element)
    ) {
      // Reclassify the link as non-inline.
      result = false;
    }
    // Return the result.
    return result;
  }
});
