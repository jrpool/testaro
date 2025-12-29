/*
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  nu
  Utilities for Testaro tests nuVal and nuVnu.
*/

// ########## IMPORTS

// Module to add Testaro IDs to elements.
const {addTestaroIDs} = require('./testaro');
// Module to get the document source.
const {getSource} = require('./getSource');

// ########## FUNCTIONS

// Gets the content for a nuVal or nuVnu test.
exports.getContent = async (page, withSource) => {
  const data = {
    withSource,
    testTarget: null
  };
  // If the specified content type was the page source:
  if (withSource) {
    // Get it.
    const sourceData = await getSource(page);
    // If the source was not obtained:
    if (sourceData.prevented) {
      // Report this.
      data.prevented = true;
      data.error = sourceData.error;
    }
    // Otherwise, i.e. if it was obtained:
    else {
      // Add it to the data.
      data.testTarget = sourceData.source;
    }
  }
  // Otherwise, i.e. if the specified content type was the Playwright page content:
  else {
    // Annotate all elements on the page with unique identifiers.
    await addTestaroIDs(page);
    // Add the annotated page content to the data.
    data.testTarget = await page.content();
  }
  // Return the data.
  return data;
};
// Postprocesses a result from nuVal or nuVnu tests.
exports.curate = async (page, data, nuData, rules) => {
  // Delete most of the test target from the data.
  data.testTarget = `${data.testTarget.slice(0, 200)}…`;
  let result;
  // If a result was obtained:
  if (nuData) {
    // Delete left and right quotation marks and their erratic invalid replacements.
    const nuDataValid = JSON.stringify(nuData).replace(/[\u{fffd}“”]/ug, '');
    const nuDataClean = JSON.parse(nuDataValid);
    result = nuDataClean;
  }
  // If there is a result and rules were specified:
  if (result && rules && Array.isArray(rules) && rules.length) {
    // Remove all messages except those specified.
    result.messages = result.messages.filter(message => rules.some(rule => {
      if (rule[0] === '=') {
        return message.message === rule.slice(1);
      }
      else if (rule[0] === '~') {
        return new RegExp(rule.slice(1)).test(message.message);
      }
      else {
        console.log(`ERROR: Invalid nuVal rule ${rule}`);
        return false;
      }
    }));
  }
  // If there is a result:
  if (result) {
    // Remove messages reporting duplicate blank IDs.
    const badMessages = new Set(['Duplicate ID .', 'The first occurrence of ID  was here.']);
    result.messages = result.messages.filter(
      message => ! badMessages.has(message.message)
    );
    // For each message:
    for (const message of result.messages) {
      const {extract} = message;
      const testaroIDArray = extract.match(/data-testaro-id="(\d+)#"/);
      // If its extract contains a Testaro identifier:
      if (testaroIDArray) {
        const testaroID = message.testaroID = testaroIDArray[1];
        // Add location data for the element to the message.
        message.elementLocation = await page.evaluate(testaroID => {
          const element = document.querySelector(`[data-testaro-id="${testaroID}#"]`);
          // If any element has that identifier:
          if (element) {
            // Get box and path IDs for the element.
            const box = {};
            let boxID = '';
            const boundingBox = element.getBoundingClientRect() || {};
            if (boundingBox.x) {
              ['x', 'y', 'width', 'height'].forEach(coordinate => {
                box[coordinate] = Math.round(boundingBox[coordinate]);
              });
            }
            if (typeof box.x === 'number') {
              boxID = Object.values(box).join(',');
            }
            const pathID = window.getXPath(element) || '';
            // Treat them as the element location.
            return {
              boxID,
              pathID
            };
          }
          // Otherwise, i.e. if no element has it, make the location data empty.
          return {};
        }, testaroID);
      }
      // Otherwise, i.e. if its extract contains no Testaro identifier:
      else {
        // Add a non-DOM location to the message.
        message.elementLocation = {
          notInDOM: true,
          boxID: '',
          pathID: ''
        };
      }
    }
  }
  // Return the result.
  return result;
};
