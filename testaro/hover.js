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
  const getBadWhat = async element => {
    const isVisible = element.checkVisibility({
      contentVisibilityAuto: true,
      opacityProperty: true,
      visibilityProperty: true
    })
    if (isVisible && element.getAttribute('role') !== 'tooltip') {
      let timer;
      let observer;
      const hoverEvent = new MouseEvent('pointerover', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      // Neutralize the hover location.
      document.body.dispatchEvent(new MouseEvent('pointerover'));
      // Allow time for handlers of this event to complete execution.
      await new Promise(resolve => setTimeout(resolve, 100));
      const observationStart = Date.now();
      // Execute a Promise that resolves when a mutation is observed.
      const mutationPromise = new Promise(resolve => {
        // When mutations are observed:
        observer = new MutationObserver(mutationRecords => {
          const otherMutatedRecords = mutationRecords.filter(record => {
            const {target} = record;
            return target !== element && target.getAttribute('role') !== 'tooltip';
          });
          const impactCount = otherMutatedRecords.length;
          const impactDetails = otherMutatedRecords.map(record => {
            const {attributeName, target} = record;
            const xPath = getXPath(target);
            const textStart = target.textContent?.slice(0, 20).trim().replace(/\s+/g, ' ') || '';
            return `${target.tagName}[${attributeName || ''}](${xPath})<${textStart}>`;
          });
          // If they occur in any other element(s) except tooltips:
          if (impactCount) {
            const impactTime = Math.round(Date.now() - observationStart);
            const impactWhat = impactCount === 1
            ? '1 other element'
            : `${impactCount} other elements`;
            const impactWhatLong = `${impactWhat} (${impactDetails.join(', ')})`;
            // Create a violation description with the mutated element count and the elapsed time.
            const violationWhat = `Hovering over the element adds, removes, or changes ${impactWhatLong} after ${impactTime}ms`;
            // Clear the timer.
            clearTimeout(timer);
            // Stop the observer.
            observer.disconnect();
            // Resolve the Promise with the violation description.
            resolve(violationWhat);
          }
        });
        // Start observing.
        observer.observe(document.body, {
          attributes: true,
          // attributeFilter: ['style', 'class', 'hidden', 'aria-hidden', 'disabled', 'open'],
          subtree: true,
          childList: true
        });
        // Start hovering over the element.
        element.dispatchEvent(hoverEvent);
      });
      // Execute a Promise that resolves when a time limit expires.
      const timeoutPromise = new Promise(resolve => {
        // If no mutation is observed before the time limit:
        timer = setTimeout(() => {
          // Stop the observer.
          observer.disconnect();
          // Resolve the Promise with an empty string.
          resolve('');
        }, 400);
      });
      // Get the violation description or timeout report.
      const violationWhat = await Promise.race([mutationPromise, timeoutPromise]);
      // If any mutations occurred before the time limit:
      if (violationWhat) {
        // Return the violation description.
        return violationWhat;
      }
      //XXX Temp
      return 'No mutations';
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
   'a',
   'button'
  ].join(', ');
  const whats = 'Hovering over elements adds, removes, or changes other elements';
  return await doTest(
    page, withItems, 'hover', selector, whats, 0, '', getBadWhat.toString()
  );
};
