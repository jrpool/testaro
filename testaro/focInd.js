/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.
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
  focInd

  This test reports focusable elements without standard focus indicators. The standard focus
  indicator is deemed to be a solid outline with a line thickness of at least 2 pixels and a
  non-transparent color, and only if the element, when not focused, has no outline.

  The focus indicator is checked immediately after the element is focused. Thus, a delayed focus
  indicator is ignored. Indication delayed is treated as indication denied. The bases for this
  treatment are that delayed indication interferes with rapid human or mechanized document
  consumption and also, if it must be respected, slows accessibility testing.

  Solid outlines are the standard and thus most familiar focus indicator. Other focus indicators
  are likely to be misunderstood. For example, underlines may be mistaken for selection or link
  indicators.

  WARNING: This test fails to recognize outlines when run with firefox.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get whether the element is visible.
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    });
    // If so:
    if (isVisible) {
      // Get whether it is focusable.
      const isFocusable = element.tabIndex === 0;
      // If so:
      if (isFocusable) {
        // Get its live style declaration.
        const styleDec = window.getComputedStyle(element);
        // If the element has an outline before being focused:
        if (styleDec.outlineWidth !== '0px') {
          // Return a violation description.
          return 'Element is focusable but has an outline when blurred';
        }
        // Otherwise, i.e. if the element has no outline, focus the element.
        element.focus({preventScroll: true});
        // If it now has no outline:
        if (styleDec.outlineWidth === '0px') {
          // Return a violation description.
          return 'Element when focused has no outline';
        }
        // Otherwise, if it now has an outline thinner than 2 pixels:
        if (Number.parseFloat(styleDec.outlineWidth) < 2) {
          // Return a violation description.
          return 'Element when focused has an outline thinner than 2 pixels';
        }
        // Otherwise, if it now has a transparent outline:
        if (styleDec.outlineColor === 'rgba(0, 0, 0, 0)') {
          // Return a violation description.
          return 'Element when focused has a transparent outline';
        }
        // Otherwise, if it now has a non-solid outline:
        if (styleDec.outlineStyle !== 'solid') {
          // If the outline style exists:
          if (styleDec.outlineStyle) {
            // If the style is not delegated to the user agent:
            if (styleDec.outlineStyle !== 'auto') {
              // Return a violation description
              return `Element when focused has an outline with the ${styleDec.outlineStyle} instead of solid style`;
            }
          }
          // Otherwise, i.e. if no outline style exists:
          else {
            // Return a violation description.
            return 'Element when focused has an outline with no instead of solid style';
          }
        }
      }
    }
  };
  const whats = 'Elements fail to have standard focus indicators';
  return await doTest(
    page, withItems, 'focInd', 'body *', whats, 1, null, getBadWhat.toString()
  );
};
