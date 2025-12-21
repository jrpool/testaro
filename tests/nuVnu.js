/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  This tool subjects a page and its source to the Nu Html Checker, thereby testing scripted content found only in the loaded page and erroneous content before the browser corrects it. The API erratically replaces left and right double quotation marks with invalid UTF-8, which appears as 2 or 3 successive instances of the replacement character (U+fffd). Therefore, this test removes all such quotation marks and the replacement character. That causes 'Bad value “” for' to become 'Bad value  for'. Since the corruption of quotation marks is erratic, no better solution is known.
  This tool is the installed version of the Nu Html Checker. It is an alternative to the nuVal tool, which uses the same validator as a web service of the World Wide Web Consortium (W3C). Each tool has advantages and disadvantages. The main advantage of the nuVnu tool is that it can evaluate pages larger than about 80,000 bytes and pages reachable from the host that Testaro runs on even if not reachable from the public Internet. The main advantage of nuVal is that it does not require the Testaro host to provide a Java virtual machine.
*/

// IMPORTS

// Module to run tests.
const {vnu} = require('vnu-jar');
// Module to get the document source.
const {getSource} = require('../procs/getSource');

// FUNCTIONS

// Conducts and reports the Nu Html Checker tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules} = act;
  // Get the browser-parsed page.
  const pageContent = await page.content();
  // Get the source.
  const sourceData = await getSource(page);
  const data = {
    docTypes: {
      pageContent: {},
      rawPage: {}
    }
  };
  const result = {};
  // If the source was not obtained:
  if (sourceData.prevented) {
    // Report this.
    data.prevented = true;
    data.error = sourceData.error;
  }
  // Otherwise, i.e. if it was obtained:
  else {
    const pageTypes = [['pageContent', pageContent], ['rawPage', sourceData.source]];
    // For each page type:
    for (const page of pageTypes) {
      try {
        // Get a Nu Html Checker report on it.
        const nuResult = await vnu.check(page[1]);
        // Delete left and right quotation marks and their erratic invalid replacements.
        const nuResultClean = JSON.parse(JSON.stringify(nuResult).replace(/[\u{fffd}“”]/ug, ''));
        result[page[0]] = nuResultClean;
        // If there is a report and rules were specified:
        if (! result[page[0]].error && rules && Array.isArray(rules) && rules.length) {
          // Remove all messages except those specified.
          result[page[0]].messages = result[page[0]].messages.filter(message => rules.some(rule => {
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
      }
      // If an error occurred:
      catch (error) {
        // Report it.
        const message = `ERROR getting results for ${page[0]} (${error.message})`;
        console.log(message);
        data.docTypes[page[0]].prevented = true;
        data.docTypes[page[0]].error = message;
      };
    };
    // If both page types prevented testing:
    if (pageTypes.every(pageType => data.docTypes[pageType[0]].prevented)) {
      // Report this.
      data.prevented = true;
      data.error = 'Both doc types prevented';
    }
  }
  return {
    data,
    result
  };
};
