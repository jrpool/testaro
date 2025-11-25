/*
  © 2025 Jonathan Robert Pool. All rights reserved.
  Licensed under the MIT License. See LICENSE file for details.
*/

/*
  shoot
  This test makes a full-page screenshot and returns it as a PNG object.
*/

// IMPORTS

const {PNG} = require('pngjs');
const {screenShot} = require('../procs/screenShot');
const {report} = require('../run');

// FUNCTIONS

exports.reporter = async page => {
  // Get the result of the previous iterations of this test, if any.
  const thisAct = report.acts.filter(act => act.type === 'test' && act.which === 'testaro');
  const thisTestResult = thisAct.result.shoot;
  // If any previous failure occurred:
  if (thisTestResult && ! thisTestResult.success) {
    // Return a failure without making a screenshot.
    return {
      success: false,
      prevented: true,
      error: 'At least 1 screenshot failed'
    };
  }
  // Otherwise, make and get a screenshot.
  const shot = await screenShot(page);
  // If it succeeded:
  if (shot.length) {
    // Get the screenshot as an object representation of a PNG image.
    const png = PNG.sync.read(shot);
    // Add it to the test result.
    thisTestResult.pngs.push(png);
    // Return the updated result.
    return {
      success: true,
      prevented: false,
      pngs
    };
  }
  // Otherwise, i.e. if it failed:
  else {
    // Return this.
    return {
      success: false,
      prevented: true,
      error: 'Screenshot failed'
    };
  }
};
