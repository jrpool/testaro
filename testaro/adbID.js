/*
  © 2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Juan S. Casado. All rights reserved.
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
  Clean-room rule:This test reports elements referencing aria-describedby targets that are missing
  or, because of duplicate IDs, ambiguous. An earlier version of this test was
  originally developed under a clean-room procedure to ensure its independence from
  the implementation of a test for a similar rule in the Tenon tool.
*/

// IMPORTS

const {doTest} = require('../procs/testaro');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  const getBadWhat = element => {
    // Get the IDs in the aria-describedby attribute of the element.
    const IDs = element.getAttribute('aria-describedby').trim().split(/\s+/).filter(Boolean);
    // If there are none:
    if (! IDs.length) {
      // Return a violation description.
      return 'Element has an aria-describedby attribute with no value';
    }
    // Otherwise, i.e. if there is at least 1 ID:
    else {
      // For each ID:
      for (const id of IDs) {
        // Get the element with that ID.
        const describer = document.getElementById(id);
        // If it doesn't exist:
        if (! describer) {
          // Return a violation description.
          return `No element has the aria-describedby ID ${id}`;
        }
        // Otherwise, i.e. if it exists:
        else {
          // Get the elements with that ID.
          const sameIDElements = document.querySelectorAll(`#${id}`);
          // If there is more than one:
          if (sameIDElements.length > 1) {
            // Return a violation description.
            return `Multiple elements share the aria-describedby ID ${id}`;
          }
        }
      }
    }
  };
  const whats = 'Elements have aria-describedby attributes with missing or invalid id values';
  return await doTest(
    page, withItems, 'adbID', '[aria-describedby]', whats, 3, null, getBadWhat.toString()
  );
};
