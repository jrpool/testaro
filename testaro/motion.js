/*
  © 2025 Jonathan Robert Pool. All rights reserved.
  Licensed under the MIT License. See LICENSE for details.
*/

/*
  motion
  This test reports motion in a page. For minimal accessibility, standards require motion to be
  brief, or else stoppable by the user. But stopping motion can be difficult or impossible, and,
  by the time a user manages to stop motion, the motion may have caused annoyance or harm. For
  superior accessibility, a page contains no motion until and unless the user authorizes it. The
  test compares two screen shots made by the shoot test before this test is performed. It
  reports a rule violation if any pixels change. The larger the change fraction, the greater the
  ordinal severity.

  WARNING: This test uses the procs/screenShot module. See the warning in that module about browser
  types.
*/

// IMPORTS

// Module to make a screenshot.
const pixelmatch = require('pixelmatch').default;
const {result} = require('../tests/testaro');

// FUNCTIONS

// Reports motion in a page.
exports.reporter = async page => {
  // Initialize the totals and standard instances.
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Get the screenshots made by the shoot test.
  const shootResult = result ? result.shoot || {} : {};
  // If there are at least 2 of them:
  if (shootResult.pngs && shootResult.pngs.length > 1) {
    let {pngs} = shootResult;
    // Choose the first and last of them for comparison.
    const pngPair = [pngs[0], pngs[pngs.length - 1]];
    // Get their dimensions.
    const {width, height} = pngPair[0];
    console.log(`XXX Screenshot dimensions: ${width}x${height}`);
    // If their dimensions differ:
    if (width !== pngPair[1].width || height !== pngPair[1].height) {
      // Report this.
      data.prevented = true;
      data.error = 'Screenshots have differing dimensions';
    }
    // Otherwise, i.e. if their dimensions are identical:
    else {
      // Get the count of differing pixels between the shots.
      const pixelChanges = pixelmatch(pngPair[0].data, pngPair[1].data, null, width, height);
      // Get the ratio of differing to all pixels as a percentage.
      const changePercent = 100 * pixelChanges / (width * height);
      console.log(`XXX Pixel changes: ${pixelChanges} (${changePercent.toFixed(4)}%)`);
      // Free the memory used by screenshots.
      pngs = [];
      // If any pixels were changed:
      if (pixelChanges) {
        // Get the ordinal severity from the fractional pixel change.
        const ordinalSeverity = Math.floor(Math.min(3, 0.4 * Math.sqrt(changePercent)));
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
  }
  // Otherwise, i.e. if there are not at least 2 of them
  else {
    // Report this.
    data.prevented = true;
    data.error = 'Fewer than 2 screenshots recorded';
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
