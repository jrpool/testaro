/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
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

  This test is an alternative to the motion test. Whereas the motion test relies on screenshots made
  earlier in the same job by the shoot test, this test makes its own screenshots. MotionSolo waits
  several seconds between its screenshots to allow time for motion to occur. That mait makes
  motionSolo, and any job containing it, take longer than the combination of shoot tests and the
  motion test.

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
  if (! data.prevented) {
    // If any pixels were changed:
    if (data.pixelChanges) {
      // Get the ordinal severity from the fractional pixel change.
      const ordinalSeverity = Math.floor(Math.min(3, 0.4 * Math.sqrt(data.changePercent)));
      // Add to the totals.
      totals[ordinalSeverity] = 1;
      // Get a summary standard instance.
      standardInstances.push({
        ruleID: 'motionSolo',
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
