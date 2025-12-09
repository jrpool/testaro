/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.

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
  captionLoc
  Report caption elements that are not the first child of their table element.
*/

// FUNCTIONS

exports.reporter = async (page, withItems) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(withItems => {
    // Get all candidates, i.e. caption elements.
    const candidates = document.body.querySelectorAll('caption');
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(element => {
      const parent = element.parentElement;
      // If the element is not the first child of a table element:
      if (! parent || parent.tagName !== 'TABLE' || parent.firstElementChild !== el) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = 'caption element is not the first child of a table element';
          // Add an instance to the instances.
          instances.push(window.getInstance(element, 'captionLoc', what, 1, 3));
        }
      }
    });
    // If there are any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'caption elements are not the first children of table elements';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'captionLoc', what, violationCount, 3, 'caption'));
    }
    return {
      data: {},
      totals: [0, 0, 0, violationCount],
      standardInstances: instances
    }
  }, withItems);
};
