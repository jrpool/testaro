/*
  © 2021–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  wave
  This test implements the WebAIM WAVE ruleset for accessibility. The 'reportType' argument
  specifies a WAVE report type: 1, 2, 3, or 4.
*/

// CONSTANTS

const https = require('https');

// FUNCTIONS

// Conducts and reports the WAVE tests.
exports.reporter = async (page, report, actIndex) => {
  // Create a host and a path for a request to the WAVE API.
  const act = report.acts[actIndex];
  const {reportType, url, prescript, postscript, rules} = act;
  const waveKey = process.env.WAVE_KEY;
  const waveKeyParam = waveKey ? `key=${waveKey}` : '';
  let host = 'wave.webaim.org';
  if (url && url.startsWith('http')) {
    host = url.replace(/^https?:\/\//, '');
  }
  let prescriptParam = prescript ? `prescript=${prescript}` : '';
  let postscriptParam = postscript ? `postscript=${postscript}` : '';
  const wavePath = '/api/request';
  const queryParams = [
    waveKeyParam,
    `url=${page.url()}`,
    `reporttype=${reportType}`,
    prescriptParam,
    postscriptParam
  ];
  const query = queryParams.filter(param => param).join('&');
  const path = [wavePath, query].join('?');
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
  // Make a request to the WAVE API.
  https.get(
    {
      host,
      path
    },
    response => {
      let rawReport = '';
      response.on('data', chunk => {
        rawReport += chunk;
      });
      // When the response arrives:
      response.on('end', async () => {
        try {
          // Parse it as JSON.
          result.nativeResult = JSON.parse(rawReport);
        }
        // If it was not parsable:
        catch (error) {
          // Report this.
          data.prevented = true;
          data.error = error.message;
          result.nativeResult = {};
        }
        // If the response was parsed:
        if (! data.prevented) {
          const {nativeResult} = result;
          const {categories} = nativeResult;
          // Delete its unnecessary properties.
          delete categories.feature;
          delete categories.structure;
          delete categories.aria;
          // For each WAVE rule category:
          ['error', 'contrast', 'alert'].forEach(categoryName => {
            const category = categories[categoryName];
            const ordinalSeverity = categoryName === 'alert' ? 0 : 3;
            // If any violations were reported:
            if (
              category?.items
              && Object.keys(category.items).length
            ) {
              const {items} = category;
              // If rules to be tested for were specified:
              if (rules && rules.length) {
                // For each rule violated:
                Object.keys(items).forEach(ruleID => {
                  // If it was not a specified rule:
                  if (! rules.includes(ruleID)) {
                    // Decrease the category violation count by the count of its violations.
                    category.count -= items[ruleID].count;
                    // Remove its violations from the native result.
                    delete items[ruleID];
                  }
                });
              }
              // If standard results are to be reported:
              if (standard) {
                const {standardResult} = result;
                const {totals, instances} = standardResult;
                // Add the category violation count to the standard-result totals.
                totals[ordinalSeverity] += category.count;
                const pathIDItems = await page.evaluate(items => {
                  const ruleIDs = Object.keys(items);
                  // For each rule of the category with any violations:
                  ruleIDs.forEach(ruleID => {
                    const {selectors} = items[ruleID];
                    // For each of those violations:
                    selectors.forEach(selector => {
                      // Get the violating element.
                      const violator = document.querySelector(selector[0]);
                      // Add its path ID to the violation record.
                      selector.push(window.getXPath(violator) ?? '');
                    });
                  });
                  return items;
                }, items);
                const ruleIDs = Object.keys(pathIDItems);
                // For each rule of the category with any violations:
                for (const ruleID of ruleIDs) {
                  const {description, selectors} = pathIDItems[ruleID];
                  // For each violation of the rule:
                  for (const violation of selectors) {
                    // Initialize a standard instance.
                    const instance = {
                      ruleID,
                      what: description,
                      ordinalSeverity,
                      count: 1
                    };
                    const pathID = violation[2];
                    // If the path ID of the violator was found:
                    if (pathID) {
                      // Get the catalog index of the violator.
                      const catalogIndex = getXPathCatalogIndex(pathID);
                      // If the acquisition succeeded:
                      if (catalogIndex) {
                        // Add the catalog index to the instance.
                        instance.catalogIndex = catalogIndex;
                      }
                      // Otherwise, i.e. if the acquisition failed:
                      else {
                        // Add the path ID to the instance.
                        instance.pathID = pathID;
                      }
                    }
                    // Add the instance to the standard result.
                    instances.push(instance);
                  }
                }
              }
            }
          });
          // Add important data to the result.
          if (statistics) {
            data.pageTitle = statistics.pagetitle || '';
            data.pageURL = statistics.pageurl || '';
            data.elapsedSeconds = statistics.time || null;
            data.creditsRemaining = statistics.creditsremaining || null;
            data.allItemCount = statistics.allitemcount || null;
            data.totalElements = statistics.totalelements || null;
            data.waveURL = statistics.waveurl || '';
          }
          // Return the result.
          resolve(actResult);
            }
            catch(error) {
              data.prevented = true;
              data.error = error.message;
              resolve(actResult);
            };
          });
        }
      );
    });
  }
  catch (error) {
    data.prevented = true;
    data.error = error.message;
  };
  return {
    data,
    result
  };
};
