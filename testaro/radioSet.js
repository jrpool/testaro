/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  radioSet
  This test reports nonstandard grouping of radio buttons. It defines standard grouping to require
  that two or more radio buttons with the same name, and no other radio buttons, be grouped in a
  'fieldset' element with a valid 'legend' element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'input[type=radio]');
  const params = {
    nameLeak: 'shares a name with others outside its field set',
    fsMixed: 'shares a field set with others having different names',
    only1RB: 'is the only one with its name in its field set',
    legendBad: 'is in a field set without a valid legend',
    noFS: 'is not in a field set',
    noName: 'has no name attribute'
  };
  // For each locator:
  for (const loc of all.allLocs) {
    // Get whether and, if so, how it violates the rule.
    const howBad = await loc.evaluate(el => {
      // Get its name.
      const elName = el.name;
      // If it has one:
      if (elName) {
        // Identify the field set of the element.
        const elFS = el.closest('fieldset');
        // If it has one:
        if (elFS) {
          // Get the first child element of the field set.
          const fsChild1 = elFS.firstElementChild;
          // Get whether the child is a legend with text content.
          const legendOK = fsChild1.tagName === 'LEGEND'
          && fsChild1.textContent.replace(/\s/g, '').length;
          // If it is:
          if (legendOK) {
            // Get the count of radio buttons with the same name in the field set.
            const nameGroupSize = elFS
            .querySelectorAll(`input[type=radio][name=${elName}]`)
            .length;
            // If the count is at least 2:
            if (nameGroupSize > 1) {
              // Get the count of radio buttons in the field set.
              const groupSize = elFS.querySelectorAll('input[type=radio]').length;
              // If it is the same:
              if (groupSize === nameGroupSize) {
                // Get the count of radio buttons with the same name in the document.
                const nameDocSize = document
                .querySelectorAll(`input[type=radio][name=${elName}]`)
                .length;
                // If none of them is outside the field set:
                if (nameDocSize === nameGroupSize) {
                  // Return rule conformance.
                  return false;
                }
                else {
                  return 'nameLeak';
                }
              }
              else {
                return 'fsMixed';
              }
            }
            else {
              return 'only1RB';
            }
          }
          else {
            return 'legendBad';
          }
        }
        else {
          return 'noFS';
        }
      }
      else {
        return 'noName';
      }
    });
    // If it does:
    if (howBad) {
      // Add the locator to the array of violators.
      all.locs.push([loc, params[howBad]]);
    }
  }
  // Populate and return the result.
  const whats = [
    'Radio button __param__', 'Radio buttons are not validly grouped in fieldsets with legends'
  ];
  return await getRuleResult(withItems, all, 'radioSet', whats, 2, 'INPUT');
};
