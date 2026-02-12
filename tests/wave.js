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
  // Initialize the results.
  const data = {};
  let result = {};
  try {
    result = await new Promise(resolve => {
      // Make the request.
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
          // When they arrive:
          response.on('end', async () => {
            let actResult = {};
            // Delete unnecessary properties.
            try {
              actResult = JSON.parse(rawReport);
              const {categories, statistics} = actResult;
              delete categories.feature;
              delete categories.structure;
              delete categories.aria;
              // If rules were specified:
              if (rules && rules.length) {
                // For each WAVE rule category:
                ['error', 'contrast', 'alert'].forEach(categoryName => {
                  const category = categories[categoryName];
                  // If any violations were reported:
                  if (
                    category
                    && category.items
                    && Object.keys(category.items).length
                  ) {
                    const {items} = category;
                    // For each rule violated:
                    Object.keys(items).forEach(ruleID => {
                      // If it was not a specified rule:
                      if (! rules.includes(ruleID)) {
                        // Decrease the category violation count by the count of its violations.
                        category.count -= items[ruleID].count;
                        // Remove its violations from the report.
                        delete items[ruleID];
                      }
                    });
                  }
                });
              }
              // Get the WAVE WCAG documentation.
              const waveDocResponse = await fetch('https://wave.webaim.org/api/docs');
              const waveDoc = waveDocResponse.ok ? await waveDocResponse.json() : [];
              // For each rule category:
              for (const categoryName of Object.keys(categories)) {
                const category = categories[categoryName];
                // If any violations were reported in the category:
                if (
                  category
                  && category.items
                  && Object.keys(category.items).length
                ) {
                  const {items} = category;
                  // For each rule violated (named item by WAVE):
                  for (const ruleName of Object.keys(items)) {
                    const ruleDoc = waveDoc.find((rule => rule.name === ruleName));
                    const {guidelines} = ruleDoc;
                    const rule = items[ruleName];
                    // Add WCAG information to the rule data.
                    rule.wcag = guidelines || [];
                    // For each violation:
                    for (const index in rule.selectors) {
                      const selector = rule.selectors[index] || '';
                      let excerpt = '';
                      // If a selector is provided:
                      if (selector) {
                        // Get an excerpt of the element.
                        excerpt = await page.evaluate(selector => {
                          const element = document.querySelector(selector);
                          // If the selector matches an element:
                          if (element) {
                            // Get an excerpt of the element.
                            const rawExcerpt = element.textContent.trim() || element.outerHTML.trim();
                            const normalizedExcerpt = rawExcerpt.replace(/\s+/g, ' ');
                            return normalizedExcerpt.slice(0, 300);
                          }
                          else {
                            return '';
                          }
                        }, selector);
                      }
                      // Convert the violation selector to a selector-excerpt pair.
                      rule.selectors[index] = [selector, excerpt];
                    }
                  }
                }
              };
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
