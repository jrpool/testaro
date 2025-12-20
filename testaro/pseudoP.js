/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/
/*
  pseudoP
  This test reports 2 or more sequential br elements without intervening text content. They may be inferior substitutes for p elements.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the node before the element node.
    const previousNode = element.previousSibling;
    let isBad = false;
    // If it is a br element:
    if (previousNode && previousNode.nodeType === Node.ELEMENT_NODE && previousNode.tagName === 'BR') {
      // Classify the element as a violator.
      isBad = true;
    }
    // Otherwise, if it is a text node:
    else if (previousNode && previousNode.nodeType === Node.TEXT_NODE) {
      // If the text node contains only whitespace:
      if (previousNode.textContent.trim() === '') {
        // Get the node before the text node.
        const beforeText = previousNode.previousSibling;
        // If that node is a br element:
        if (beforeText && beforeText.nodeType === Node.ELEMENT_NODE && beforeText.tagName === 'BR') {
          // Classify the element as a violator.
          isBad = true;
        }
      }
    }
    // If the element is a violator:
    if (isBad) {
      // Return a violation description.
      return `Element follows another br element, possibly constituting a pseudo-paragraph`;
    }
  };
  const whats = 'br elements follow other br elements, possibly constituting pseudo-paragraphs';
  return await doTest(
    page, withItems, 'pseudoP', 'body br', whats, 0, 'BR', getBadWhat.toString()
  );
};
