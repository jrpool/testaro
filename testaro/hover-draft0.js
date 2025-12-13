/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
  hover
  This test reports unexpected impacts of hovering. The elements that are subjected to hovering
  (called “triggers”) include all the elements that have ARIA attributes associated with control
  over the visibility of other elements and all the elements that have onmouseenter or
  onmouseover attributes, as well as a sample of all visible elements in the body. If hovering over
  an element results in an increase or decrease in the total count of visible elements in the body,
  the rule is considered violated.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    let violationDescription;
    const hoverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    let timer;
    // Create a mutation observer.
    const observer = new MutationObserver(mutations => {
      // When any mutation occurs in any other element(s):
      const otherMutatedRecords = mutations.filter(
        record => record.target !== element && record.target.getAttribute('role') !== 'tooltip'
      );
      // Update the count of mutated elements and the violation description.
      const impactCount = otherMutatedRecords.length;
      const impactWhat = impactCount === 1 ? '1 other element1' : `${impactCount} other elements`;
      violationDescription = `Hovering over the element adds, removes, or changes ${impactWhat}`;
      // Stop the observer.
      observer.disconnect();
      // Clear the timer.
      clearTimeout(timer);
    });
    // Ensure that the mouse is in the home position.
    document.body.dispatchEvent(hoverEvent);
    // Start observing.
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      childList: true
    });
    // Start hovering over the element.
    element.dispatchEvent(hoverEvent);
    // In case no other elements were mutated within 200ms, stop the observer.
    timer = setTimeout(() => {
      observer.disconnect();
    }, 200);
    // If any other elements were mutated within 200ms:
    if (violationDescription) {
      // Return the violation description.
      return violationDescription;
    }
  };
  const selector = [
   '[aria-controls]',
   '[aria-expanded]',
   '[aria-haspopup]',
   '[onmouseenter]',
   '[onmouseover]',
   '[onmouseenter]',
   '[onmouseover]',
   '[role="menu"]',
   '[role="menubar"]',
   '[role="menuitem"]',
   '[data-tooltip]',
   '[data-popover]',
   '[data-hover]',
   '[data-menu]',
   '[data-dropdown]',
   '[role="tab"]',
   '[role="combobox"]',
   'li'
  ].join(', ');
  const whats = 'Hovering over elements adds, removes, or changes other elements';
  return doTest(
    page, withItems, 'hover', selector, whats, 0, '', getBadWhat.toString()
  );
};
