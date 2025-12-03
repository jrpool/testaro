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

// CONSTANTS

// Descriptions of violation types.
const violationTypes = {
  empty: 'Element has an aria-describedby attribute with no value',
  missing: 'Referenced description of the element does not exist',
  ambiguous: 'Multiple elements share the ID of a referenced description of the element'
};

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Get data on violations of the rule.
  const violationData = await page.evaluate(withItems => {
    // Get all elements with aria-describedby attributes.
    const elements = document.body.querySelectorAll('[aria-describedby]');
    // Initialize a violation count and an array of violation items.
    let violationCount = 0;
    const violationItems = [];
    // For each such element:
    elements.forEach(el => {
      // Initialize the element as a nonviolator.
      let violationType = '';
      // Get the IDs in its aria-describedby attribute.
      const IDs = el.getAttribute('aria-describedby').trim().split(/\s+/);
      // If there are none:
      if (IDs.length === 0 || IDs[0] === '') {
        // Consider the element a violator.
        violationType = 'empty';
      }
      // Otherwise, i.e. if there is at least 1 ID:
      else {
        // For each ID:
        for (const id of IDs) {
          // Get the element with that ID.
          const describer = document.getElementById(id);
          // If it doesn't exist:
          if (! describer) {
            // Consider the element a violator.
            violationType = 'missing';
            // Stop checking the element.
            break;
          }
          // Otherwise, i.e. if it exists:
          else {
            // Get the elements with that ID.
            const sameIDElements = document.querySelectorAll(`#${id}`);
            // If there is more than one:
            if (sameIDElements.length > 1) {
              // Consider the element a violator.
              violationType = 'ambiguous';
              // Stop checking the element.
              break;
            }
          }
        }
      }
      // If the element is a violator:
      if (violationType) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          // Get its bounding box.
          const boxData = el.getBoundingClientRect();
          ['x', 'y', 'width', 'height'].forEach(dimension => {
            boxData[dimension] = Math.round(boxData[dimension]);
          });
          const {x, y, width, height} = boxData;
          // Add data on the element to the violation items.
          violationItems.push({
            tagName: el.tagName,
            id: el.id || '',
            location: {
              doc: 'dom',
              type: 'box',
              spec: {
                x,
                y,
                width,
                height
              }
            },
            excerpt: el.textContent.trim(),
            boxID: [x, y, width, height].join(':'),
            pathID: window.getXPath(el),
            violationType
          });
        }
      }
    });
    return {
      violationCount,
      violationItems
    };
  }, withItems);
  const {violationCount, violationItems} = violationData;
  // Initialize the standard instances.
  const standardInstances = [];
  // If itemization is required:
  if (withItems) {
    // For each violation item:
    violationItems.forEach(violationItem => {
      // Add a standard instance.
      const {tagName, id, location, excerpt, boxID, pathID, violationType} = violationItem;
      standardInstances.push({
        ruleID: 'adbID',
        what: violationTypes[violationType],
        ordinalSeverity: 1,
        tagName,
        id,
        location,
        excerpt,
        boxID,
        pathID
      });
    });
  }
  // Otherwise, i.e. if itemization is not required:
  else {
    const {violationCount} = violationData;
    // Summarize the violations.
    standardInstances.push({
      ruleID: 'adbID',
      what: 'Elements have invalid aria-describedby values',
      ordinalSeverity: 1,
      count: violationCount,
      tagName: '',
      id: '',
      location: {
        doc: '',
        type: '',
        spec: ''
      },
      excerpt: '',
      boxID: '',
      pathID: ''
    });
  }
  return {
    data: {},
    totals: [0, violationCount, 0, 0],
    standardInstances
  };
};
