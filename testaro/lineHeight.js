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

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(withItems => {
    // Get all elements.
    const allElements = document.body.querySelectorAll('*');
    // Get all violation candidates, i.e. elements that have non-empty child text nodes.
    const candidates = Array.from(allElements).filter(el =>
      Array.from(el.childNodes).some(child =>
        child.nodeType === Node.TEXT_NODE &&
        child.textContent.trim().length
      )
    );
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      // Get its relevant style properties.
      const styleDec = window.getComputedStyle(element);
      const {fontSize, lineHeight} = styleDec;
      const fontSizeNum = Number.parseFloat(fontSize);
      const lineHeightNum = Number.parseFloat(lineHeight);
      // If it violates the rule:
      if (lineHeightNum < 1.495 * fontSizeNum) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const fontSizeRounded = fontSizeNum.toFixed(1);
          const lineHeightRounded = lineHeightNum.toFixed(1);
          const what = `Element line height (${lineHeightRounded}px) is less than 1.5 times its font size (${fontSizeRounded}px)`;
          // Add an instance to the instances.
          instances.push(window.getInstance(element, 'lineHeight', what, 1, 1));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'Element line heights are less than 1.5 times their font sizes';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'lineHeight', what, violationCount, 1));
    }
    return {
      data: {},
      totals: [0, violationCount, 0, 0],
      standardInstances: instances
    };
  }, withItems);
};
