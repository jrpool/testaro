/*
  © 2023 CVS Health and/or one of its affiliates. All rights reserved.

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
  autocomplete
  This test reports failures to equip name and email inputs with correct autocomplete attributes.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, getRuleResult} = require('../procs/testaro');
// Module to get locator data.
const {getLocatorData} = require('../procs/getLocatorData');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (
  page,
  withItems,
  emailLabels = ['email'],
  nameLabels = ['name'],
  givenLabels = ['first name', 'forename', 'given name'],
  familyLabels = ['last name', 'surname', 'family name']
) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(args => {
    const [withItems, givenLabels, familyLabels, emailLabels] = args;
    // Get all candidates, i.e. text and email input elements.
    const candidates = document.body.querySelectorAll(
      'input[type=text], input[type=email], input:not([type])'
    );
    let violationCount = 0;
    const instances = [];
    // For each candidate:
    candidates.forEach(candidate => {
      // Get its lower-cased accessible name.
      const name = window.getAccessibleName(candidate).toLowerCase();
      const actualAuto = candidate.getAttribute('autocomplete');
      // If its type or accessible name indicates it is an email input:
      if (candidate.type === 'email' || emailLabels.some(label => name.includes(label))) {
        // If it has no autocomplete attribute with email value:
        if (actualAuto !== 'email') {
          // Increment the violation count.
          violationCount++;
          // If itemization is required:
          if (withItems) {
            const what = 'Email input has no autocomplete="email" attribute';
            // Add an instance to the instances.
            instances.push(window.getInstance(candidate, 'autocomplete', what, 1, 2));
          }
        }
      }
      // Otherwise, if its type and accessible name indicate it is a given-name input:
      else if (candidate.type === 'text' && givenLabels.some(label => name.includes(label))) {
        // If it has no autocomplete attribute with given-name value:
        if (actualAuto !== 'given-name') {
          // Increment the violation count.
          violationCount++;
          // If itemization is required:
          if (withItems) {
            const what = 'Given-name input has no autocomplete="given-name" attribute';
            // Add an instance to the instances.
            instances.push(window.getInstance(candidate, 'autocomplete', what, 1, 2));
          }
        }
      }
      // Otherwise, if its type and accessible name indicate it is a family-name input:
      else if (candidate.type === 'text' && familyLabels.some(label => name.includes(label))) {
        // If it has no autocomplete attribute with family-name value:
        if (actualAuto !== 'family-name') {
          // Increment the violation count.
          violationCount++;
          // If itemization is required:
          if (withItems) {
            const what = 'Given-name input has no autocomplete="given-name" attribute';
            // Add an instance to the instances.
            instances.push(window.getInstance(candidate, 'autocomplete', what, 1, 2));
          }
        }
      }
    });
  }, [withItems, givenLabels, familyLabels, emailLabels]);
  // Initialize the locators and result.
  // For each locator:
  const autoValues = {
    'given-name': givenLabels,
    'family-name': familyLabels,
    'email': emailLabels
  };
  for (const loc of all.allLocs) {
    // Get which autocomplete value, if any, its element needs.
    const elData = await getLocatorData(loc);
    const lcText = elData.excerpt.toLowerCase();
    const neededAutos = Object.keys(autoValues)
    .filter(autoValue => autoValues[autoValue].some(typeLabel => lcText.includes(typeLabel)));
    let neededAuto;
    if (neededAutos.length === 1) {
      neededAuto = neededAutos[0];
    }
    else if (! neededAutos.length && await loc.getAttribute('type') === 'email') {
      neededAuto = 'email';
    }
    // If it needs one:
    if (neededAuto) {
      // If it does not have the one it needs:
      const actualAuto = await loc.getAttribute('autocomplete');
      const isBad = actualAuto !== neededAuto;
      if (isBad) {
        // Add the locator to the array of violators.
        all.locs.push([loc, neededAuto]);
      }
    }
  }
  // Populate and return the result.
  const whats = [
    'Input is missing an autocomplete attribute with value __param__',
    'Inputs are missing applicable autocomplete attributes'
  ];
  return await getRuleResult(withItems, all, 'autocomplete', whats, 2);
};
