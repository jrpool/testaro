/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  nuVal
  This tool subjects a page and its source to the Nu Html Checker, thereby testing scripted content found only in the loaded page and erroneous content before the browser corrects it. The API erratically replaces left and right double quotation marks with invalid UTF-8, which appears as 2 or 3 successive instances of the replacement character (U+fffd). Therefore, this test removes all such quotation marks and the replacement character. That causes 'Bad value “” for' to become 'Bad value  for'. Since the corruption of quotation marks is erratic, no better solution is known.
  This tool is the API version of the Nu Html Checker. It is an alternative to the nuVnu tool, which uses the same validator as an installed dependency. Each tool has advantages and disadvantages. The main advantage of nuVal is that it does not require the Testaro host to provide a Java virtual machine. The main disadvantage of nuVal is that it returns 502 status errors when the content being uploaded is larger than about 80,000 bytes. The main advantage of the nuVnu tool is that it can evaluate pages larger than about 80,000 bytes and pages reachable from the host that Testaro runs on even if not reachable from the public Internet.
*/

// IMPORTS

// Module to get the content.
const {curate, getContent} = require('../procs/nu');
// Module to process XPaths.
const {getAttributeXPath, getXPathCatalogIndex} = require('../procs/xPath');

// FUNCTIONS

// Conducts and reports the Nu Html Checker API tests.
exports.reporter = async (page, report, actIndex) => {
  const act = report.acts[actIndex];
  const {rules, withSource} = act;
  // Initialize the act report.
  const data = {};
  const result = {
    nativeResult: {},
    standardResult: {}
  };
  const standard = report.standard !== 'no';
  // If standard results are to be reported:
  if (standard) {
    // Initialize the standard result.
    result.standardResult = {
      prevented: false,
      totals: [0, 0, 0, 0],
      instances: []
    };
  }
  const {standardResult} = result;
  // Get the content.
  const content = await getContent(page, withSource);
  const {testTarget} = content;
  // If it was obtained and contains a test target:
  if (testTarget) {
    const fetchOptions = {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'text/html; charset=utf-8'
      },
      body: testTarget
    };
    const nuURL = 'https://validator.w3.org/nu/?parser=html&out=json';
    let nuData;
    try {
      // Get a Nu Html Checker report from the W3C validator service.
      nuResponse = await fetch(nuURL, fetchOptions);
      // If the acquisition succeeded:
      if (nuResponse.ok) {
        // Get the response body as an object.
        nuData = await nuResponse.json();
      }
      // Otherwise, i.e. if the request failed:
      else {
        // Get the response body as text.
        const nuResponseText = await nuResponse.text();
        // Add a failure report to the data.
        data.prevented = true;
        data.error = `HTTP ${nuResponse.status}: ${nuResponse.statusText} (${nuResponseText.slice(0, 200)})`;
      }
    }
    // If an error occurred:
    catch (error) {
      // Report it.
      const message = `ERROR getting results (${error.message}; status ${nuResult?.status || 'none'} (${JSON.stringify(nuData?.body || 'no body', null, 2)})`;
      console.log(message);
      data.prevented = true;
      data.error = message;
    };
    // Postprocess the response data and add the postprocessed data to the native result.
    result.nativeResult = await curate(data, nuData, rules);
    // If standard results are to be reported:
    if (standard) {
      // For each message in the native result:
      result.nativeResult.messages.forEach(message => {
        const ordinalSeverity = message.type === 'info' ? 0 : 3;
        // Increment the applicable standard-result total.
        standardResult.totals[ordinalSeverity]++;
        // Initialize a standard instance.
        const standardInstance = {
          ruleID: message.message,
          what: message.message,
          ordinalSeverity,
          count: 1,
        };
        // Get the XPath of the element from its extract.
        const xPath = getAttributeXPath(message.extract);
        // If the acquisition succeeded:
        if (xPath) {
          // Get the catalog index of the element from the XPath.
          const catalogIndex = getXPathCatalogIndex(report.catalog, xPath);
          // If the acquisition succeeded:
          if (catalogIndex) {
            // Add the catalog index to the standard instance.
            standardInstance.catalogIndex = catalogIndex;
          }
          // Otherwise, i.e. if the acquisition failed:
          else {
            // Add the XPath of the standard instance as its pathID.
            standardInstance.pathID = xPath;
          }
        }
        // Add the standard instance to the standard result.
        standardResult.instances.push(standardInstance);
      })
    }
  }
  // Otherwise, i.e. if the page content was not obtained:
  else {
    // Report this.
    data.prevented = true;
    data.error = 'Content not obtained';
  }
  return {
    data,
    result
  };
};
