/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

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

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body *:visible');
  all.result.data.focusableCount = 0;
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether its element is focusable.
    const isFocusable = await loc.evaluate(el => el.tabIndex === 0);
    // If it is:
    if (isFocusable) {
      // Add this to the report.
      all.result.data.focusableCount++;
      // Get whether it has a nonstandard focus indicator.
      const hasBadIndicator = await loc.evaluate(el => {
        // Get the live style declaration of the element.
        const styleDec = window.getComputedStyle(el);
        // If the element has an outline:
        if (styleDec.outlineWidth !== '0px') {
          // Return a violation.
          return 'an outline when blurred';
        }
        // Otherwise, i.e. if the element has no outline:
        else {
          // Focus the element.
          el.focus({preventScroll: true});
          // If it now has no outline:
          if (styleDec.outlineWidth === '0px') {
            // Return this violation.
            return 'no focus outline';
          }
          // Otherwise, if it now has an outline thinner than 2 pixels:
          else if (Number.parseFloat(styleDec.outlineWidth) < 2) {
            // Return this violation.
            return 'a focus outline thinner than 2 pixels';
          }
          // Otherwise, if it now has a transparent outline:
          else if (styleDec.outlineColor === 'rgba(0, 0, 0, 0)') {
            // Return this violation.
            return 'a transparent focus outline';
          }
          // Otherwise, if it now has a non-solid outline:
          else if (styleDec.outlineStyle !== 'solid') {
            // If the outline style exists:
            if (styleDec.outlineStyle) {
              // If the style is delegated to the user agent:
              if (styleDec.outlineStyle === 'auto') {
                // Return conformance.
                return false;
              }
              // Otherwise, i.e. if the style is not delegated to the user agent:
              else {
                // Return this violation.
                return `a focus outline with the ${styleDec.outlineStyle} instead of solid style`;
              }
            }
            // Otherwise, i.e. if no outline style exists:
            else {
              // Return this violation.
              return 'a focus outline with no style instead of solid style';
            }
          }
          // Otherwise, i.e. if the element now has a standard outline:
          else {
            // Return conformance.
            return false;
          }
        }
      });
      // If it does:
      if (hasBadIndicator) {
        // Add the locator to the array of violators.
        all.locs.push([loc, hasBadIndicator]);
      }
    }
  }
  // Populate and return the result.
  const whats = ['Element has __param__', 'Elements fail to have standard focus indicators'];
  return await getRuleResult(withItems, all, 'focInd', whats, 1);
};
