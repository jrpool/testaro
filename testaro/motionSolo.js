/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.

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
  motion
  This test reports motion in a page. For minimal accessibility, standards require motion to be
  brief, or else stoppable by the user. But stopping motion can be difficult or impossible, and,
  by the time a user manages to stop motion, the motion may have caused annoyance or harm. For
  superior accessibility, a page contains no motion until and unless the user authorizes it. The
  test compares two screen shots of the viewport 2 seconds and 6 seconds after page load. It
  reports a rule violation if any pixels change. The larger the change fraction, the greater the
  ordinal severity.

  WARNING: This test uses the procs/visChange module. See the warning in that module about browser
  types.
*/

// IMPORTS

// Module to get pixel changes between two times.
const {visChange} = require('../procs/visChange');

// FUNCTIONS

// Reports motion in a page.
exports.reporter = async page => {
  // Initialize the totals and standard instances.
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Make screenshots and get the result.
  const data = await visChange(page, {
    delayBefore: 2000,
    delayBetween: 3000
  });
  // If the screenshots succeeded:
  if (data.success) {
    // If any pixels were changed:
    if (data.pixelChanges) {
      // Get the ordinal severity from the fractional pixel change.
      const ordinalSeverity = Math.floor(Math.min(3, 0.4 * Math.sqrt(data.changePercent)));
      // Add to the totals.
      totals[ordinalSeverity] = 1;
      // Get a summary standard instance.
      standardInstances.push({
        ruleID: 'motion',
        what: 'Content moves or changes without user request',
        count: 1,
        ordinalSeverity,
        tagName: 'HTML',
        id: '',
        location: {
          doc: '',
          type: '',
          spec: ''
        },
        excerpt: ''
      });
    }
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
