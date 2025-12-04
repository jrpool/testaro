/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
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
  adbID
  This test reports elements referencing aria-describedby targets that are missing
  or, because of duplicate IDs, ambiguous. An earlier version of this test was
  originally developed under a clean-room procedure to ensure its independence from
  the implementation of a test for a similar rule in the Tenon tool.
*/

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Get data on violations of the rule.
  const violationData = await page.evaluate(withItems => {
    // Get all candidates, i.e. elements with aria-describedby attributes.
    const candidates = document.body.querySelectorAll('[aria-describedby]');
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      // Get the IDs in its aria-describedby attribute.
      const IDs = element.getAttribute('aria-describedby').trim().split(/\s+/).filter(Boolean);
      // If there are none:
      if (! IDs.length) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = 'Element has an aria-describedby attribute with no value';
          // Add an instance to the instances.
          instances.push(window.getInstance(element, 'adbID', what, 1, 3));
        }
      }
      // Otherwise, i.e. if there is at least 1 ID:
      else {
        // For each ID:
        for (const id of IDs) {
          // Get the element with that ID.
          const describer = document.getElementById(id);
          // If it doesn't exist:
          if (! describer) {
            // Increment the violation count.
            violationCount++;
            // If itemization is required:
            if (withItems) {
              const what = `No element has the aria-describedby ID ${id}`;
              // Add an instance to the instances.
              instances.push(window.getInstance(element, 'adbID', what, 1, 3));
            }
            // Stop checking the element.
            break;
          }
          // Otherwise, i.e. if it exists:
          else {
            // Get the elements with that ID.
            const sameIDElements = document.querySelectorAll(`#${id}`);
            // If there is more than one:
            if (sameIDElements.length > 1) {
              // Increment the violation count.
              violationCount++;
              // If itemization is required:
              if (withItems) {
                const what = `Multiple elements share the aria-describedby ID ${id}`;
                // Add an instance to the instances.
                instances.push(window.getInstance(element, 'adbID', what, 1, 2));
              }
              // Stop checking the element.
              break;
            }
          }
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'Elements have aria-describedby attributes with missing or invalid id values';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'lineHeight', what, violationCount, 3));
    }
    return {
      violationCount,
      instances
    };
  }, withItems);
  const {violationCount, instances} = violationData;
  // Return the result.
  return {
    data: {},
    totals: [0, violationCount, 0, 0],
    standardInstances: instances
  };
};
