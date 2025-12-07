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
  nameLabels = ['your name', 'full name', 'first and last name'],
  emailLabels = ['email'],
  givenLabels = ['first name', 'forename', 'given name'],
  familyLabels = ['last name', 'surname', 'family name']
) => {
  // Return totals and standard instances for the rule.
  return await page.evaluate(args => {
    const [withItems, nameLabels,givenLabels, familyLabels, emailLabels] = args;
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
      // Get its required autocomplete value.
      let requiredAuto = '';
      if (candidate.type === 'email' || emailLabels.some(label => name.includes(label))) {
        requiredAuto = 'email';
      }
      else if (candidate.type === 'text' || nameLabels.some(label => name.includes(label))) {
        requiredAuto = 'name';
      }
      else if (candidate.type === 'text' && givenLabels.some(label => name.includes(label))) {
        requiredAuto = 'given-name';
      }
      else if (candidate.type === 'text' && familyLabels.some(label => name.includes(label))) {
        requiredAuto = 'family-name';
      }
      // Get its actual autocomplete value.
      const actualAuto = candidate.getAttribute('autocomplete');
      // If an autocomplete value is required but not present:
      if (requiredAuto && ! actualAuto.includes(requiredAuto)) {
        // Increment the violation count.
        violationCount++;
        // If itemization is required:
        if (withItems) {
          const what = `input has no autocomplete="${requiredAuto}" attribute`;
          // Add an instance to the instances.
          instances.push(window.getInstance(candidate, 'autocomplete', what, 1, 2));
        }
      }
    });
    // If there were any violations and itemization is not required:
    if (violationCount && ! withItems) {
      const what = 'Inputs are missing required autocomplete attributes';
      // Add a summary instance to the instances.
      instances.push(window.getInstance(null, 'autocomplete', what, violationCount, 2));
    }
    return {
      data: {},
      totals: [0, 0, violationCount, 0],
      instances
    }
  }, [withItems, nameLabels, givenLabels, familyLabels, emailLabels]);
};
