/*
  © 2025 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE for details.
*/

/*
  motion
  This test reports motion in a page by comparing the first and last of the screenshots previously
  made by the shoot0 and shoot1 tests.

  For minimal accessibility, standards require motion to be brief, or else stoppable by the user.
  But stopping motion can be difficult or impossible, and, by the time a user manages to stop
  motion, the motion may have caused annoyance or harm. For superior accessibility, a page contains
  no motion until and unless the user authorizes it. The test reports a rule violation if any
  pixels differ between the screenshots. The larger the change fraction, the greater the
  ordinal severity.

  WARNING: The shoot test uses the procs/screenShot module. See the warning in that module about
  browser types.
*/

// IMPORTS

// Module to process files.
const fs = require('fs/promises');
// Module to get operating-system properties.
const os = require('os');
// Module to compare screenshots.
const pixelmatch = require('pixelmatch').default;
// Module to parse PNGs.
const {PNG} = require('pngjs');

// CONSTANTS

const tmpDir = os.tmpdir();

// FUNCTIONS

// Reports motion in a page.
exports.reporter = async page => {
  // Initialize the totals and standard instances.
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // Get the screenshot PNG buffers made by the shoot0 and shoot1 tests.
  let shoot0PNGBuffer = await fs.readFile(`${tmpDir}/testaro-shoot-0.png`);
  let shoot1PNGBuffer = await fs.readFile(`${tmpDir}/testaro-shoot-1.png`);
  // Delete the buffer files.
  await fs.unlink(`${tmpDir}/testaro-shoot-0.png`);
  await fs.unlink(`${tmpDir}/testaro-shoot-1.png`);
  // If both buffers exist:
  if (shoot0PNGBuffer && shoot1PNGBuffer) {
    // Parse them into PNG objects.
    let shoot0PNG = PNG.sync.read(shoot0PNGBuffer);
    let shoot1PNG = PNG.sync.read(shoot1PNGBuffer);
    // If their dimensions differ:
    if (shoot1PNG.width !== shoot0PNG.width || shoot1PNG.height !== shoot0PNG.height) {
      // Report this.
      data.prevented = true;
      data.error = 'Screenshot dimensions differ';
    }
    // Otherwise, i.e. if their dimensions are identical:
    else {
      const {width, height} = shoot0PNG;
      // Get the count of differing pixels between the shots.
      const pixelChanges = pixelmatch(shoot0PNG.data, shoot1PNG.data, null, width, height);
      // Get the ratio of differing to all pixels as a percentage.
      const changePercent = Math.round(100 * pixelChanges / (width * height));
      // Free the memory used by screenshots.
      shoot0PNG = shoot1PNG = shoot0PNGBuffer = shoot1PNGBuffer = null;
      // If any pixels were changed:
      if (pixelChanges) {
        // Get the ordinal severity from the fractional pixel change.
        const ordinalSeverity = Math.floor(Math.min(3, 0.4 * Math.sqrt(changePercent)));
        // Add to the totals.
        totals[ordinalSeverity] = 1;
        // Get a summary standard instance.
        standardInstances.push({
          ruleID: 'motion',
          what: `Content moves or changes spontaneously (${changePercent}% of pixels changed)`,
          count: 1,
          ordinalSeverity,
          tagName: 'HTML',
          id: '',
          location: {
            doc: 'dom',
            type: 'box',
            spec: {
              x: 0,
              y: 0,
              width,
              height
            }
          },
          excerpt: '<html>…</html>'
        });
      }
    }
  }
  // Otherwise, i.e. if they do not both exist:
  else {
    // Report this.
    data.prevented = true;
    data.error = 'At least 1 screenshot missing';
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
