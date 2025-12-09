/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/*
  lineHeight
  Related to Tenon rule 144.
  This test reports elements whose line heights are less than 1.5 times their font sizes. Even
  such elements with no text create accessibility risk, because any text node added to one of
  them would have a substandard line height. Nonetheless, elements with no non-spacing text in
  their subtrees are excluded.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Define a violation function for execution in the browser.
  const getBadWhat = element => {
    // Get whether the element has a non-spacing child text node.
    const hasText = Array.from(element.childNodes).some(child =>
      child.nodeType === Node.TEXT_NODE && child.textContent.trim()
    );
    // If so:
    if (hasText) {
      // Get its relevant style properties.
      const styleDec = window.getComputedStyle(element);
      const {fontSize, lineHeight} = styleDec;
      const fontSizeNum = Number.parseFloat(fontSize);
      const lineHeightNum = Number.parseFloat(lineHeight);
      // Get whether it violates the rule.
      const isBad = lineHeightNum < 1.495 * fontSizeNum;
      // If it does:
      if (isBad) {
        const whatFontSize = `font size (${fontSizeNum.toFixed(1)}px)`;
        const whatLineHeight = `line height (${lineHeightNum.toFixed(1)}px)`;
        // Return a violation description.
        return `Element ${whatLineHeight} is less than 1.5 times its ${whatFontSize}`;
      }
    }
  };
  const whats = 'Element line heights are less than 1.5 times their font sizes';
  // Perform the test and return the result.
  return doTest(
    page, withItems, 'lineHeight', '*', whats, 1, null, getBadWhat.toString()
  );
};
