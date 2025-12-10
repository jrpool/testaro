/*
  © 2022–2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  miniText
  Derived from the bbc-a11y textCannotBeTooSmall test.
  Related to Tenon rule 134.
  This test reports elements with font sizes smaller than 11 pixels.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const rawText = element.textContent || '';
    // If the element has text content with any non-whitespace:
    if (/[^\s]/.test(rawText)) {
      const isVisible = element.checkVisibility({
        contentVisibilityAuto: true,
        opaityProperty: true,
        visibilityProperty: true
      });
      // If the element is visible:
      if (isVisible) {
        const styleDec = window.getComputedStyle(element);
        // Get its font size.
        const fontSizeString = styleDec.fontSize;
        const fontSize = Number.parseFloat(fontSizeString);
        // If its font size is smaller than 11 pixels:
        if (fontSize < 11) {
          // Return a violation description.
          return `Element is visible but its font size is ${fontSize}px, smaller than 11px`;
        }
      }
    }
  };
  const whats = 'Visible elements have font sizes smaller than 11 pixels';
  return doTest(
    page, withItems, 'miniText', 'body *:not(script, style)', whats, 2, '', getBadWhat.toString()
  );
};
