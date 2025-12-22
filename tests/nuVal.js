/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  nuVal
  This tool subjects a page and its source to the Nu Html Checker, thereby testing scripted content found only in the loaded page and erroneous content before the browser corrects it. The API erratically replaces left and right double quotation marks with invalid UTF-8, which appears as 2 or 3 successive instances of the replacement character (U+fffd). Therefore, this test removes all such quotation marks and the replacement character. That causes 'Bad value “” for' to become 'Bad value  for'. Since the corruption of quotation marks is erratic, no better solution is known.
  This tool is the API version of the Nu Html Checker. It is an alternative to the vnu tool, which uses the same validator as an installed dependency. Each tool has advantages and disadvantages. The main advantage of nuVal is that it does not require the Testaro host to provide a Java virtual machine. The main disadvantage of nuVal is that it returns 502 status errors when the content being uploaded is larger than about 80,000 bytes. The main advantage of the vnu tool is that it can evaluate pages larger than about 80,000 bytes and pages reachable from the host that Testaro runs on even if not reachable from the public Internet.
*/

// IMPORTS

// Module to process files.
const fs = require('fs/promises');
// Module to get the document source.
const {getSource} = require('../procs/getSource');

// FUNCTIONS

// Conducts and reports the Nu Html Checker tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules, withSource} = act;
  const sourceData = {};
  const data = {
    testTarget: {}
  };
  // Get the specified type of page content.
  if (withSource) {
    sourceData = await getSource(page);
    data.testTarget = sourceData.source;
  }
  else {
    data.testTarget = await page.pageContent();
  }
  const result = {};
  const fetchOptions = {
    method: 'post',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'text/html; charset=utf-8'
    }
  };
  // If the page content was obtained:
  if (data.testTarget && ! sourceData.prevented) {
    // Specify the W3C validator URL for the testing.
    const nuURL = 'https://validator.w3.org/nu/?parser=html&out=json';
    try {
      fetchOptions.body = data.testTarget;
      // Get a Nu Html Checker report.
      const nuResult = await fetch(nuURL, fetchOptions);
      // If the request failed:
      if (! nuResult.ok) {
        // Get the response body as text.
        const resultText = await nuResult.text();
        // Add a failure report to the data.
        result.prevented = true;
        result.error = `HTTP ${nuResult.status}: ${nuResult.statusText}`;
        result.rawBody = resultText;
        data.docTypes[page[0]] = result[page[0]];
      }
      // Otherwise, i.e. if it succeeded:
      else {
        // Get the response body as JSON.
        const nuData = await nuResult.json();
        // Delete left and right quotation marks and their erratic invalid replacements.
        const nuDataClean = JSON.parse(JSON.stringify(nuData).replace(/[\u{fffd}“”]/ug, ''));
        result[page[0]] = nuDataClean;
      }
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
      // Remove messages reporting duplicate blank IDs.
      const badMessages = new Set(['Duplicate ID .', 'The first occurrence of ID  was here.']);
      result[page[0]].messages = result[page[0]].messages.filter(
        message => ! badMessages.has(message.message)
      );
    }
    // If an error occurred:
    catch (error) {
      // Report it.
      const message = `ERROR getting results for ${page[0]} (${error.message}; status ${nuResult.status}, body ${JSON.stringify(nuResult?.body, null, 2)}`;
      console.log(message);
      data.docTypes[page[0]].prevented = true;
      data.docTypes[page[0]].error = message;
    };
    // If both page types prevented testing:
    if (pageTypes.every(pageType => data.docTypes[pageType[0]].prevented)) {
      // Report this.
      data.prevented = true;
      data.error = 'Both doc types prevented';
    }
  }
  // If the source was specified but not obtained:
  else(sourceData.prevented) {
    // Report this.
    data.prevented = true;
    data.error = sourceData.error;
  }
  return {
    data,
    result
  };
};
