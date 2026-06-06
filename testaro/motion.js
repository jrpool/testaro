/*
  © 2025–2026 Jonathan Robert Pool.
  Licensed under the MIT License. See LICENSE for details.
*/

/*
  motion
  This test reports motion in a page by making a page image and comparing it with the initial one, i.e. the one made by the catalog proc.

  For minimal accessibility, standards require motion to be brief, or else stoppable by the user. But stopping motion can be difficult or impossible, and, by the time a user manages to stop motion, the motion may have caused annoyance or harm. For superior accessibility, a page contains no motion until and unless the user authorizes it. The test reports a rule violation if any pixels differ between the screenshots. The larger the change fraction, the greater the ordinal severity.

  WARNING: The shoot test uses the procs/screenShot module. See the warning in that module about browser types.
*/

// IMPORTS

const {getXPathCatalogIndex} = require('../procs/xPath');
const {shoot} = require('../procs/shoot');
const pixelmatch = require('pixelmatch').default;
const {PNG} = require('pngjs');

// FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, report) => {
  // Initialize the totals and standard instances.
  const data = {};
  const totals = [0, 0, 0, 0];
  const standardInstances = [];
  // If the initial image exists:
  if (report.images?.length) {
    let violationWhat = '';
    let ordinalSeverity = 0;
    // Make an image with the same color type as the initial one and get its base64 encoding.
    const png = await shoot(page, report, {
      exclusionSelector: null,
      colorType: report.imageColor,
      action: 'return'
    });
    // If this succeeded:
    if (png) {
      // Parse both base64 encodings into PNG objects.
      const initialPNG = PNG.sync.read(Buffer.from(report.images[0], 'base64'));
      const finalPNG = PNG.sync.read(Buffer.from(png, 'base64'));
      // If their dimensions differ:
      if (finalPNG.width !== initialPNG.width || finalPNG.height !== initialPNG.height) {
        const fromSize = `${initialPNG.width}×${initialPNG.height}`;
        const toSize = `${finalPNG.width}×${finalPNG.height}`;
        // Describe the violation.
        violationWhat = `Page size changes spontaneously (from ${fromSize} to ${toSize})`;
      }
      // Otherwise, i.e. if their dimensions are identical:
      else {
        // Get the count of differing pixels between the images, using the default sensitivity.
        try {
          const pixelChanges = pixelmatch(
            initialPNG.data,
            finalPNG.data,
            null,
            initialPNG.width,
            initialPNG.height,
            {
              threshold: 0.1
            }
          );
          // Get the ratio of differing to all pixels as a percentage.
          const changePercent = Math.round(
            100 * pixelChanges / (initialPNG.width * initialPNG.height)
          );
          // If any pixels were changed:
          if (pixelChanges) {
            // Describe the violation.
            violationWhat = `Content changes spontaneously (${changePercent}% of pixels changed)`;
            // Get the ordinal severity from the fractional pixel change.
            ordinalSeverity = Math.floor(Math.min(3, 0.4 * Math.sqrt(changePercent)));
          }
        } catch (err) {
          console.log(`pixelmatch error: ${err.message}, ${err.stack}`);
          data.prevented = true;
          data.error = `Pixel comparison failed: ${err.message}`;
        }
      }
      // If there was a violation:
      if (violationWhat) {
        // Add to the totals.
        totals[ordinalSeverity] = 1;
        // Get a summary standard instance.
        standardInstances.push({
          ruleID: 'motion',
          what: violationWhat,
          ordinalSeverity,
          count: 1,
          catalogIndex: getXPathCatalogIndex(report.catalog, '/html/body')
        });
      }
    }
    // Otherwise, i.e. if it failed:
    else {
      // Report this.
      data.prevented = true;
      data.error = 'Image creation failed';
    }
  }
  // Otherwise, i.e. if the initial image does not exist:
  else {
    // Report this.
    data.prevented = true;
    data.error = 'Initial image missing';
  }
  // Return the result.
  return {
    data,
    totals,
    standardInstances
  };
};
