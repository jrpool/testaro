/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  focVis
  Derived from the bbc-a11y elementsMustBeVisibleOnFocus test.
  This test reports links that are at least partly off the display when focused.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If the element is visible:
    if (isVisible) {
      // Focus it.
      element.focus();
      const box = element.getBoundingClientRect();
      // If it violates the rule:
      if (box.x < 0 || box.y < 0) {
        // Return a violation description.
        return 'Upper left corner of the element is above or to the left of the display';
      }
    }
  };
  const whats = 'Visible links are above or to the left of the display';
  return doTest(
    page, withItems, 'focVis', 'a', whats, 2, 'A', getBadWhat.toString()
  );
};
