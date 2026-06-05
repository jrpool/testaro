/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jeff Witt.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  doActs.js
  Performs the acts of a job.
*/

// IMPORTS

const {addError} = require('./error');
const {getNonce, goTo, launch, wait} = require('./launch');
const {tools} = require('./job');
const {fork} = require('child_process');
const {pruneCatalog} = require('./catalog');
// Function to take a full-page screenshot.
const {shoot} = require('./shoot');
// Module to handle file system operations.
const {applyMultiplier} = require('./config');
const fs = require('fs/promises');
const path = require('path');

// CONSTANTS

// CSS selectors for targets of moves.
const moves = {
  button: 'button, [role=button], input[type=submit]',
  checkbox: 'input[type=checkbox]',
  focus: true,
  link: 'a, [role=link]',
  radio: 'input[type=radio]',
  search: 'input[type=search], input[aria-label*=search i], input[placeholder*=search i]',
  select: 'select',
  text: 'input'
};
// Seconds to wait between actions.
const waits = Number.parseInt(process.env.WAITS) || 0;
// Time limits in seconds on tools, accounting for page reloads by 6 Testaro tests.
const timeLimits = {
  alfa: 35,
  aslint: 45,
  axe: 30,
  ed11y: 30,
  htmlcs: 30,
  ibm: 30,
  nuVal: 40,
  nuVnu: 25,
  qualWeb: 45,
  testaro: 200 + Math.round(6 * waits / 1000),
  wave: 25
};
// Abort aggressiveness.
const abortAssertively = process.env.ABORT_ASSERTIVELY === 'true';

// FUNCTIONS

// Normalizes spacing characters and cases in a string.
const debloat = string => string.replace(/\s/g, ' ').trim().replace(/ {2,}/g, ' ').toLowerCase();
// Returns the first line of an error message.
const errorStart = error => error.message.replace(/\n.+/s, '');
// Returns a property value and whether it satisfies an expectation.
const isTrue = (object, specs) => {
  const property = specs[0];
  const propertyTree = property.split('.');
  let actual = property.length ? object[propertyTree[0]] : object;
  // Identify the actual value of the specified property.
  while (propertyTree.length > 1 && actual !== undefined) {
    propertyTree.shift();
    actual = actual[propertyTree[0]];
  }
  // If the expectation is that the property does not exist:
  if (specs.length === 1) {
    // Return whether the expectation is satisfied.
    return [actual, actual === undefined];
  }
  // Otherwise, i.e. if the expectation is of a property value:
  else if (specs.length === 3) {
    // Return whether the expectation was fulfilled.
    const relation = specs[1];
    const criterion = specs[2];
    let satisfied;
    if (actual === undefined) {
      return [null, false];
    }
    else if (relation === '=') {
      satisfied = actual === criterion;
    }
    else if (relation === '<') {
      satisfied = actual < criterion;
    }
    else if (relation === '>') {
      satisfied = actual > criterion;
    }
    else if (relation === '!') {
      satisfied = actual !== criterion;
    }
    else if (relation === 'i') {
      satisfied = typeof actual === 'string' && actual.includes(criterion);
    }
    else if (relation === '!i') {
      satisfied = typeof actual === 'string' && ! actual.includes(criterion);
    }
    else if (relation === 'e') {
      satisfied = typeof actual === 'object'
      && JSON.stringify(actual) === JSON.stringify(criterion);
    }
    return [actual, satisfied];
  }
  // Otherwise, i.e. if the specifications are invalid:
  else {
    // Return this.
    return [null, false];
  }
};
// Returns the browser ID of an act.
const getActBrowserID = (report, actIndex) => report?.acts[actIndex]?.browserID
|| report?.browserID
|| '';
// Returns the target URL of an act.
const getActTargetURL = (report, actIndex) => report?.acts[actIndex]?.target?.url
|| report?.target?.url
|| '';
// Returns the text of an element, lower-cased.
const textOf = async (page, element) => {
  if (element) {
    const tagNameJSHandle = await element.getProperty('tagName');
    const tagName = await tagNameJSHandle.jsonValue();
    let totalText = '';
    // If the element is a link, button, input, or select list:
    if (['A', 'BUTTON', 'INPUT', 'SELECT'].includes(tagName)) {
      // Return its visible labels, descriptions, and legend if the first input in a fieldset.
      totalText = await page.evaluate(element => {
        const {tagName, ariaLabel} = element;
        let ownText = '';
        if (['A', 'BUTTON'].includes(tagName)) {
          ownText = element.textContent;
        }
        else if (tagName === 'INPUT' && element.type === 'submit') {
          ownText = element.value;
        }
        // HTML link elements have no labels property.
        const labels = tagName !== 'A' ? Array.from(element.labels) : [];
        const labelTexts = labels.map(label => label.textContent);
        if (ariaLabel) {
          labelTexts.push(ariaLabel);
        }
        const refIDs = new Set([
          element.getAttribute('aria-labelledby') || '',
          element.getAttribute('aria-describedby') || ''
        ].join(' ').split(/\s+/));
        if (refIDs.size) {
          refIDs.forEach(id => {
            const labeler = document.getElementById(id);
            if (labeler) {
              const labelerText = labeler.textContent.trim();
              if (labelerText.length) {
                labelTexts.push(labelerText);
              }
            }
          });
        }
        let legendText = '';
        if (tagName === 'INPUT') {
          const fieldsets = Array.from(document.body.querySelectorAll('fieldset'));
          const inputFieldsets = fieldsets.filter(fieldset => {
            const inputs = Array.from(fieldset.querySelectorAll('input'));
            return inputs.length && inputs[0] === element;
          });
          const inputFieldset = inputFieldsets[0] || null;
          if (inputFieldset) {
            const legend = inputFieldset.querySelector('legend');
            if (legend) {
              legendText = legend.textContent;
            }
          }
        }
        return [legendText].concat(labelTexts, ownText).join(' ');
      }, element);
    }
    // Otherwise, if it is an option:
    else if (tagName === 'OPTION') {
      // Return its text content, prefixed with the text of its select parent if the first option.
      const ownText = await element.textContent();
      const indexJSHandle = await element.getProperty('index');
      const index = await indexJSHandle.jsonValue();
      if (index) {
        totalText = ownText;
      }
      else {
        const selectJSHandle = await page.evaluateHandle(
          element => element.parentElement, element
        );
        const select = await selectJSHandle.asElement();
        if (select) {
          const selectText = await textOf(page, select);
          totalText = [ownText, selectText].join(' ');
        }
        else {
          totalText = ownText;
        }
      }
    }
    // Otherwise, i.e. if it is not an input, select, or option:
    else {
      // Get its text content.
      totalText = await element.textContent();
    }
    return debloat(totalText);
  }
  else {
    return null;
  }
};
// Adds a wait error result to an act.
const waitError = (page, act, error, what) => {
  console.log(`ERROR waiting for ${what} (${error.message})`);
  act.result.found = false;
  act.result.url = page.url();
  act.result.error = `ERROR waiting for ${what}`;
  return false;
};
// Performs the acts in a report and adds the results to the report.
exports.doActs = async report => {
  // Make a temporary copy of the report. Precondition: report is valid.
  let tempReport = JSON.parse(JSON.stringify(report));
  let page = null;
  let {acts} = tempReport;
  // Get the standardization specification.
  const standard = tempReport.standard || 'only';
  // Get the path to a writable temporary directory.
  const {tmpDir} = report.jobData;
  let reportPath;
  // Get a path for temporary reports.
  reportPath = path.join(tmpDir, `${tempReport.id}.json`);
  // Initialize the count of completed acts.
  let actCount = 0;
  // For each act in the temporary report:
  for (const actIndex in acts) {
    // If the job has not been aborted:
    if (tempReport?.jobData && ! tempReport.jobData.aborted) {
      let act = acts[actIndex];
      const {type, which} = act;
      const actSuffix = type === 'test' ? ` ${which}` : '';
      const message = `>>>> ${type}${actSuffix}`;
      // Log the act.
      console.log(message);
      // If the act is an index changer:
      if (type === 'next') {
        const condition = act.if;
        const logSuffix = condition.length === 3 ? ` ${condition[1]} ${condition[2]}` : '';
        console.log(`>> ${condition[0]}${logSuffix}`);
        // Identify the act to be checked.
        const ifActIndex = acts.map(act => act.type !== 'next').lastIndexOf(true);
        // Determine whether its jump condition is true.
        const truth = isTrue(acts[ifActIndex].result, condition);
        // Add the result to the act.
        act.result = {
          property: condition[0],
          relation: condition[1],
          criterion: condition[2],
          value: truth[0],
          jumpRequired: truth[1]
        };
        // If the condition is true:
        if (truth[1]) {
          // If the performance of acts is to stop:
          if (act.jump === 0) {
            // Stop processing acts.
            break;
          }
          // Otherwise, if there is a numerical jump:
          else if (act.jump) {
            // Set the act index accordingly.
            actIndex += act.jump - 1;
          }
          // Otherwise, if there is a named next act:
          else if (act.next) {
            // Set the new index accordingly, or stop if it does not exist.
            actIndex = acts.map(act => act.name).indexOf(act.next) - 1;
          }
        }
      }
      // Otherwise, if the act is a launch:
      else if (type === 'launch') {
        // Launch a browser, navigate, optionally make a screenshot, and add the result to the act.
        page = await launch({
          report: tempReport,
          actIndex,
          tempBrowserID: getActBrowserID(tempReport, actIndex),
          tempURL: getActTargetURL(tempReport, actIndex),
          xPathNeed: 'none',
          shoot: act.shoot
        });
        // If this failed:
        if (! page) {
          // Report this.
          addError(false, false, tempReport, actIndex, page.error ?? '');
        }
      }
      // Otherwise, if the act is a test act:
      else if (type === 'test') {
        // Add a description of the tool to the act.
        act.what = tools[act.which];
        // Get the start time of the act.
        const startTime = Date.now();
        // Add it to the act.
        act.startTime = startTime;
        let tempReportJSON = JSON.stringify(tempReport);
        // Save a copy of the temporary report, which the child process will read.
        await fs.writeFile(reportPath, tempReportJSON);
        let timedOut = false;
        const limitMs = applyMultiplier(1000 * (timeLimits[act.which] || 15));
        const actResult = await new Promise(resolve => {
          let closed = false;
          // Create a child process to perform the act.
          const child = fork(`${__dirname}/doTestAct`, [reportPath, actIndex]);
          let killTimer = null;
          // Start a timeout timer for the child process.
          const timeoutTimer = setTimeout(() => {
            if (! timedOut) {
              timedOut = true;
              console.log(`ERROR: Timed out at ${Math.round(limitMs / 1000)} seconds`);
              child.kill('SIGTERM');
              killTimer = setTimeout(() => {
                if (! closed) {
                  console.log('ERROR: Failed to exit on SIGTERM from parent')
                }
                child.kill('SIGKILL');
              }, 2000);
            }
          }, limitMs);
          // Clears any current timers.
          const clearTimers = () => {
            [timeoutTimer, killTimer].forEach(timer => {
              if (timer) {
                clearTimeout(timer);
              }
            });
          };
          // If the child process sends a message (normally Act completed):
          child.on('message', message => {
            if (! closed) {
              closed = true;
              clearTimers();
              // Return the message.
              resolve({
                kind: 'message',
                message
              });
            }
          });
          // If the child process sends an error:
          child.on('error', error => {
            if (! closed) {
              closed = true;
              clearTimers();
              // Return the error message.
              resolve({
                kind: 'error',
                error: error.message
              });
            }
          });
          // If the child process closes:
          child.on('close', (code, signal) => {
            if (! closed) {
              closed = true;
              clearTimers();
              // Return the exit code, signal, and timeout status.
              resolve({
                kind: 'close',
                code,
                signal,
                timedOut
              });
            }
          });
        });
        // If the child process sent a message:
        if (actResult.kind === 'message') {
          // Get the revised tempReport file.
          tempReportJSON = await fs.readFile(reportPath, 'utf8');
          try {
            // Reassign it to the temporary report.
            tempReport = JSON.parse(tempReportJSON);
            // Redefine the acts as those in the revised temporary report.
            ({acts} = tempReport);
          }
          // If the reassignment fails, leaving the temporary report and its acts unchanged:
          catch (error) {
            // Report this.
            console.log(
              `ERROR: Tool sent message ${actResult.message}. Report is no longer JSON (${error.message}) but is instead a(n) ${typeof tempReportJSON} of length ${tempReportJSON.length}:\n${tempReportJSON}`
            );
            // Report this and that the job was aborted.
            addError(
              false,
              true,
              tempReport,
              actIndex,
              `Non-JSON temporary report file after message ${actResult.message}`
            );
            // Stop processing acts.
            break;
          }
        }
        // Otherwise, i.e. if the child process closed abnormally:
        else {
          // Report this and, if so configured, that the job was aborted.
          const {code, error, kind, signal} = actResult;
          if (kind === 'close' && timedOut) {
            addError(
              false,
              abortAssertively,
              tempReport,
              actIndex,
              `Timed out at ${Math.round(limitMs / 1000)} seconds`
            );
          }
          else if (kind === 'close') {
            addError(
              true,
              abortAssertively,
              tempReport,
              actIndex,
              `Closed with code ${code} and signal ${signal})`
            );
          }
          else {
            addError(
              true, abortAssertively, tempReport, actIndex, `Terminated with error ${error}`
            );
          }
          // If the job was aborted:
          if (abortAssertively) {
            // Stop processing acts.
            break;
          }
        }
        // Get the (usually revised) act.
        act = acts[actIndex];
        // Add the elapsed time of the tool to the temporary report.
        const time = Math.round((Date.now() - startTime) / 1000);
        const {toolTimes} = tempReport.jobData;
        toolTimes[act.which] ??= 0;
        toolTimes[act.which] += time;
        // If the act was not prevented:
        if (act.data && ! act.data.prevented) {
          const expectations = act.expect;
          // If the act has expectations:
          if (expectations) {
            // Initialize whether they were fulfilled.
            act.expectations = [];
            let failureCount = 0;
            // For each expectation:
            expectations.forEach(spec => {
              // Add its result to the act.
              const truth = isTrue(act, spec);
              act.expectations.push({
                property: spec[0],
                relation: spec[1],
                criterion: spec[2],
                actual: truth[0],
                passed: truth[1]
              });
              if (! truth[1]) {
                failureCount++;
              }
            });
            act.expectationFailures = failureCount;
          }
        }
      }
      // Otherwise, if a current page exists:
      else if (page) {
        // If the act is navigation to a url:
        if (type === 'url') {
          // Identify the URL.
          const resolved = act.which.replace('__dirname', __dirname);
          requestedURL = resolved;
          // Visit it and wait until the DOM is loaded.
          const navResult = await goTo(tempReport, page, requestedURL, 15000, 'domcontentloaded');
          // If the visit succeeded:
          if (navResult.success) {
            // Revise the temporary report URL to this URL.
            tempReport.target.url = requestedURL;
            // Add the script nonce, if any, to the act.
            const {response} = navResult;
            const scriptNonce = getNonce(response);
            if (scriptNonce) {
              tempReport.jobData.lastScriptNonce = scriptNonce;
            }
            // Add the resulting URL to the act.
            if (! act.result) {
              act.result = {};
            }
            act.result.url = page.url();
            // If a prohibited redirection occurred:
            if (response.exception === 'badRedirection') {
              // Report this.
              addError(true, false, tempReport, actIndex, 'ERROR: Navigation illicitly redirected');
            }
          }
          // Otherwise, i.e. if the visit failed:
          else {
            // Report this.
            addError(true, false, tempReport, actIndex, 'ERROR: Visit failed');
          }
        }
        // Otherwise, if the act is a wait for text:
        else if (type === 'wait') {
          const {what, which} = act;
          console.log(`>> ${what}`);
          const result = act.result = {};
          // If the text is to be the URL:
          if (what === 'url') {
            // Wait for the URL to be the exact text.
            try {
              await page.waitForURL(which, {timeout: 15000});
              result.found = true;
              result.url = page.url();
            }
            // If the wait times out:
            catch(error) {
              // Report this.
              waitError(page, act, error, 'text in the URL');
            }
          }
          // Otherwise, if the text is to be a substring of the page title:
          else if (what === 'title') {
            // Wait for the page title to include the text, case-insensitively.
            try {
              await page.waitForFunction(
                text => document
                && document.title
                && document.title.toLowerCase().includes(text.toLowerCase()),
                which,
                {
                  polling: 1000,
                  timeout: 5000
                }
              );
              result.found = true;
              result.title = await page.title();
            }
            // If the wait times out:
            catch(error) {
              // Report this.
              waitError(page, act, error, 'text in the title');
            }
          }
          // Otherwise, if the text is to be a substring of the text of the page body:
          else if (what === 'body') {
            // Wait for the body to include the text, case-insensitively.
            try {
              await page.waitForFunction(
                text => document
                && document.body
                && document.body.innerText.toLowerCase().includes(text.toLowerCase()),
                which,
                {
                  polling: 2000,
                  timeout: 15000
                }
              );
              result.found = true;
            }
            // If the wait times out:
            catch(error) {
              // Report this.
              waitError(page, act, error, 'text in the body');
            }
          }
        }
        // Otherwise, if the act is a wait for a state:
        else if (type === 'state') {
          // Wait for it.
          const stateIndex = ['loaded', 'idle'].indexOf(act.which);
          await page.waitForLoadState(
            ['domcontentloaded', 'networkidle'][stateIndex], {timeout: [10000, 15000][stateIndex]}
          )
          // If the wait times out:
          .catch(async error => {
            // Report this.
            console.log(`ERROR waiting for page to be ${act.which} (${error.message})`);
            addError(true, false, tempReport, actIndex, `ERROR waiting for page to be ${act.which}`);
          });
          // If the wait succeeded:
          if (actIndex > -2) {
            // Add state data to the temporary report.
            act.result = {
              success: true,
              state: act.which
            };
          }
        }
        // Otherwise, if the act is a page switch:
        else if (type === 'page') {
          const context = page.context();
          page = await context.waitForEvent('page');
          // Wait until it is idle.
          await page.waitForLoadState('networkidle', {timeout: 15000});
          // Add the resulting URL to the act.
          const result = {
            url: page.url()
          };
          act.result = result;
        }
        // Otherwise, if the page has a URL:
        else if (page.url() && page.url() !== 'about:blank') {
          const url = page.url();
          // Add the URL to the act.
          act.actualURL = url;
          // If the act is a revelation:
          if (type === 'reveal') {
            act.result = {
              success: true
            };
            // Make all elements in the page visible.
            await page.$$eval('body *', elements => {
              elements.forEach(element => {
                const styleDec = window.getComputedStyle(element);
                if (styleDec.display === 'none') {
                  element.style.display = 'initial';
                }
                if (['hidden', 'collapse'].includes(styleDec.visibility)) {
                  element.style.visibility = 'inherit';
                }
              });
            })
            .catch(error => {
              console.log(`ERROR making all elements visible (${error.message})`);
              act.result.success = false;
            });
          }
          // Otherwise, if the act is a screenshot:
          else if (type === 'shoot') {
            const {exclusionSelector, colorType, action} = act;
            // Make and dispose of a full-page screenshot.
            const shotInfo = await shoot(page, report, {
              exclusion: exclusionSelector ? page.locator(exclusionSelector) : null,
              colorType: [0, 2, 4, 6].includes(colorType) ? colorType : null,
              action: ['return', 'report', 'file'].includes(action) ? action : 'report'
            });
            // Add the PNG base-64 encoding, image index, or file path to the act result.
            act.result = shotInfo ? {success: true, shotInfo} : {success: false, prevented: true};
          }
          // Otherwise, if the act is a move:
          else if (moves[type]) {
            const selector = typeof moves[type] === 'string' ? moves[type] : act.what;
            // Try up to 5 times to:
            act.result = {found: false};
            let selection = {};
            let tries = 0;
            const slimText = act.which ? debloat(act.which) : '';
            while (tries++ < 5 && ! act.result.found) {
              if (page) {
                // Identify the elements of the specified type.
                const selections = await page.$$(selector);
                // If there are any:
                if (selections.length) {
                  // If there are enough to make a match possible:
                  if ((act.index || 0) < selections.length) {
                    // For each element of the specified type:
                    let matchCount = 0;
                    const selectionTexts = [];
                    for (selection of selections) {
                      // Add its lower-case text or an empty string to the list of element texts.
                      const selectionText = slimText ? await textOf(page, selection) : '';
                      selectionTexts.push(selectionText);
                      // If its text includes any specified text, case-insensitively:
                      if (selectionText.includes(slimText)) {
                        // If the element has the specified index among such elements:
                        if (matchCount++ === (act.index || 0)) {
                          // Report it as the matching element and stop checking.
                          act.result.found = true;
                          act.result.textSpec = slimText;
                          act.result.textContent = selectionText;
                          break;
                        }
                      }
                    }
                    // If no element satisfied the specifications:
                    if (! act.result.found) {
                      // Add the failure data to the temporary report.
                      act.result.success = false;
                      act.result.error = 'exhausted';
                      act.result.typeElementCount = selections.length;
                      if (slimText) {
                        act.result.textElementCount = --matchCount;
                      }
                      act.result.message = 'Not enough specified elements exist';
                      act.result.candidateTexts = selectionTexts;
                    }
                  }
                  // Otherwise, i.e. if there are too few such elements to make a match possible:
                  else {
                    // Add the failure data to the temporary report.
                    act.result.success = false;
                    act.result.error = 'fewer';
                    act.result.typeElementCount = selections.length;
                    act.result.message = 'Elements of specified type too few';
                  }
                }
                // Otherwise, i.e. if there are no elements of the specified type:
                else {
                  // Add the failure data to the temporary report.
                  act.result.success = false;
                  act.result.error = 'none';
                  act.result.typeElementCount = 0;
                  act.result.message = 'No elements of specified type found';
                }
              }
              // Otherwise, i.e. if the page no longer exists:
              else {
                // Add the failure data to the temporary report.
                act.result.success = false;
                act.result.error = 'gone';
                act.result.message = 'Page gone';
              }
              if (! act.result.found) {
                await wait(2000);
              }
            }
            // If a match was found:
            if (act.result.found) {
              // FUNCTION DEFINITION START
              // Performs a click or Enter keypress and waits for the network to be idle.
              const doAndWait = async isClick => {
                // Perform and report the move.
                const move = isClick ? 'click' : 'Enter keypress';
                try {
                  await isClick
                    ? selection.click({timeout: 4000})
                    : selection.press('Enter', {timeout: 4000});
                  act.result.success = true;
                  act.result.move = move;
                }
                // If the move fails:
                catch(error) {
                  // Report this.
                  addError(true, false, tempReport, actIndex, `ERROR: ${move} failed`);
                }
                if (act.result.success) {
                  try {
                    await page.context().waitForEvent('networkidle', {timeout: 10000});
                    act.result.idleTimely = true;
                  }
                  catch(error) {
                    console.log(`ERROR: Network busy after ${move} (${errorStart(error)})`);
                    act.result.idleTimely = false;
                  }
                  // Add the page URL to the result.
                  act.result.newURL = page.url();
                }
              };
              // FUNCTION DEFINITION END
              // If the move is a button click, perform it.
              if (type === 'button') {
                await selection.click({timeout: 3000});
                act.result.success = true;
                act.result.move = 'clicked';
              }
              // Otherwise, if it is checking a radio button or checkbox, perform it.
              else if (['checkbox', 'radio'].includes(type)) {
                await selection.waitForElementState('stable', {timeout: 2000})
                .catch(error => {
                  console.log(`ERROR waiting for stable ${type} (${error.message})`);
                  act.result.success = false;
                  act.result.error = `ERROR waiting for stable ${type}`;
                });
                if (! act.result.error) {
                  const isEnabled = await selection.isEnabled();
                  if (isEnabled) {
                    await selection.check({
                      force: true,
                      timeout: 2000
                    })
                    .catch(error => {
                      console.log(`ERROR checking ${type} (${error.message})`);
                      act.result.success = false;
                      act.result.error = `ERROR checking ${type}`;
                    });
                    if (! act.result.error) {
                      act.result.success = true;
                      act.result.move = 'checked';
                    }
                  }
                  else {
                    const message = `ERROR: could not check ${type} because disabled`;
                    act.result.success = false;
                    act.result.error = message;
                  }
                }
              }
              // Otherwise, if it is focusing the element, perform it.
              else if (type === 'focus') {
                await selection.focus({timeout: 2000});
                act.result.success = true;
                act.result.move = 'focused';
              }
              // Otherwise, if it is clicking a link:
              else if (type === 'link') {
                const href = await selection.getAttribute('href');
                const target = await selection.getAttribute('target');
                act.result.href = href || 'NONE';
                act.result.target = target || 'DEFAULT';
                // If the destination is a new page:
                if (target && target !== '_self') {
                  // Click the link and wait for the network to be idle.
                  doAndWait(true);
                }
                // Otherwise, i.e. if the destination is in the current page:
                else {
                  // Click the link and wait for the resulting navigation.
                  try {
                    await selection.click({timeout: 5000});
                    // Wait for the new content to load.
                    await page.waitForLoadState('domcontentloaded', {timeout: 6000});
                    act.result.success = true;
                    act.result.move = 'clicked';
                    act.result.newURL = page.url();
                  }
                  // If the click or load failed:
                  catch(error) {
                    // Report this.
                    console.log(`ERROR clicking link (${errorStart(error)})`);
                    act.result.success = false;
                    act.result.error = 'unclickable';
                    act.result.message = 'ERROR: click or load timed out';
                  }
                  // If the link click succeeded:
                  if (! act.result.error) {
                    // Add success data to the temporary report.
                    act.result.success = true;
                    act.result.move = 'clicked';
                  }
                }
              }
              // Otherwise, if it is selecting an option in a select list, perform it.
              else if (type === 'select') {
                const options = await selection.$$('option');
                let optionText = '';
                if (options && Array.isArray(options) && options.length) {
                  const optionTexts = [];
                  for (const option of options) {
                    const optionText = await option.textContent();
                    optionTexts.push(optionText);
                  }
                  const matchTexts = optionTexts.map(
                    (text, index) => text.includes(act.what) ? index : -1
                  );
                  const index = matchTexts.filter(text => text > -1)[act.index || 0];
                  if (index !== undefined) {
                    await selection.selectOption({index});
                    optionText = optionTexts[index];
                  }
                }
                act.result.success = true;
                act.result.move = 'selected';
                act.result.option = optionText;
              }
              // Otherwise, if it is entering text in an input element:
              else if (['text', 'search'].includes(type)) {
                act.result.attributes = {};
                const {attributes} = act.result;
                const type = await selection.getAttribute('type');
                const label = await selection.getAttribute('aria-label');
                const labelRefs = await selection.getAttribute('aria-labelledby');
                attributes.type = type || '';
                attributes.label = label || '';
                attributes.labelRefs = labelRefs || '';
                // If the text contains a placeholder for an environment variable:
                let {what} = act;
                if (/__[A-Z]+__/.test(what)) {
                  // Replace it.
                  const envKey = /__([A-Z]+)__/.exec(what)[1];
                  const envValue = process.env[envKey];
                  what = what.replace(/__[A-Z]+__/, envValue);
                }
                // Enter the text.
                await selection.type(what);
                tempReport.jobData.presses += what.length;
                act.result.success = true;
                act.result.move = 'entered';
                // If the input is a search input:
                if (type === 'search') {
                  // Press the Enter key and wait for a network to be idle.
                  doAndWait(false);
                }
              }
              // Otherwise, i.e. if the move is unknown, add the failure to the act.
              else {
                // Report the error.
                const message = 'ERROR: move unknown';
                act.result.success = false;
                act.result.error = message;
              }
            }
            // Otherwise, i.e. if no match was found:
            else {
              // RLeport this.
              act.result.success = false;
              act.result.error = 'absent';
              act.result.message = 'ERROR: specified element not found';
              console.log('ERROR: Specified element not found');
            }
          }
          // Otherwise, if the act is a keypress:
          else if (type === 'press') {
            // Identify the number of times to press the key.
            let times = 1 + (act.again || 0);
            tempReport.jobData.presses += times;
            const key = act.which;
            // Press the key.
            while (times--) {
              await page.keyboard.press(key);
            }
            const qualifier = act.again ? `${1 + act.again} times` : 'once';
            act.result = {
              success: true,
              message: `pressed ${qualifier}`
            };
          }
          // Otherwise, if it is a repetitive keyboard navigation:
          else if (type === 'presses') {
            const {navKey, what, which, withItems} = act;
            const matchTexts = which ? which.map(text => debloat(text)) : [];
            // Initialize the loop variables.
            let status = 'more';
            let presses = 0;
            let amountRead = 0;
            let items = [];
            let matchedText;
            // As long as a matching element has not been reached:
            while (status === 'more') {
              // Press the Escape key to dismiss any modal dialog.
              await page.keyboard.press('Escape');
              // Press the specified navigation key.
              await page.keyboard.press(navKey);
              presses++;
              // Identify the newly current element or a failure.
              const currentJSHandle = await page.evaluateHandle(actCount => {
                // Initialize it as the focused element.
                let currentElement = document.activeElement;
                // If it exists in the page:
                if (currentElement && currentElement.tagName !== 'BODY') {
                  // Change it, if necessary, to its active descendant.
                  if (currentElement.hasAttribute('aria-activedescendant')) {
                    currentElement = document.getElementById(
                      currentElement.getAttribute('aria-activedescendant')
                    );
                  }
                  // Or change it, if necessary, to its selected option.
                  else if (currentElement.tagName === 'SELECT') {
                    const currentIndex = Math.max(0, currentElement.selectedIndex);
                    const options = currentElement.querySelectorAll('option');
                    currentElement = options[currentIndex];
                  }
                  // Or change it, if necessary, to its active shadow-DOM element.
                  else if (currentElement.shadowRoot) {
                    currentElement = currentElement.shadowRoot.activeElement;
                  }
                  // If there is a current element:
                  if (currentElement) {
                    // If it was already reached within this act:
                    if (currentElement.dataset.pressesReached === actCount.toString(10)) {
                      // Report the error.
                      console.log(`ERROR: ${currentElement.tagName} element reached again`);
                      status = 'ERROR';
                      return 'ERROR: locallyExhausted';
                    }
                    // Otherwise, i.e. if it is newly reached within this act:
                    else {
                      // Mark and return it.
                      currentElement.dataset.pressesReached = actCount;
                      return currentElement;
                    }
                  }
                  // Otherwise, i.e. if there is no current element:
                  else {
                    // Report the error.
                    status = 'ERROR';
                    return 'noActiveElement';
                  }
                }
                // Otherwise, i.e. if there is no focus in the page:
                else {
                  // Report the error.
                  status = 'ERROR';
                  return 'ERROR: globallyExhausted';
                }
              }, actCount);
              // If the current element exists:
              const currentElement = currentJSHandle.asElement();
              if (currentElement) {
                // Update the data.
                const tagNameJSHandle = await currentElement.getProperty('tagName');
                const tagName = await tagNameJSHandle.jsonValue();
                const text = await textOf(page, currentElement);
                // If the text of the current element was found:
                if (text !== null) {
                  const textLength = text.length;
                  // If it is non-empty and there are texts to match:
                  if (matchTexts.length && textLength) {
                    // Identify the matching text.
                    matchedText = matchTexts.find(matchText => text.includes(matchText));
                  }
                  // Update the item data if required.
                  if (withItems) {
                    const itemData = {
                      tagName,
                      text,
                      textLength
                    };
                    if (matchedText) {
                      itemData.matchedText = matchedText;
                    }
                    items.push(itemData);
                  }
                  amountRead += textLength;
                  // If there is no text-match failure:
                  if (matchedText || ! matchTexts.length) {
                    // If the element has any specified tag name:
                    if (! what || tagName === what) {
                      // Change the status.
                      status = 'done';
                      // Perform the action.
                      const inputText = act.text;
                      if (inputText) {
                        await page.keyboard.type(inputText);
                        presses += inputText.length;
                      }
                      if (act.action) {
                        presses++;
                        await page.keyboard.press(act.action);
                        await page.waitForLoadState();
                      }
                    }
                  }
                }
                else {
                  status = 'ERROR';
                }
              }
              // Otherwise, i.e. if there was a failure:
              else {
                // Update the status.
                status = await currentJSHandle.jsonValue();
              }
            }
            // Add the result to the act.
            act.result = {
              success: true,
              status,
              totals: {
                presses,
                amountRead
              }
            };
            if (status === 'done' && matchedText) {
              act.result.matchedText = matchedText;
            }
            if (withItems) {
              act.result.items = items;
            }
            // Add the totals to the temporary report.
            tempReport.jobData.presses += presses;
            tempReport.jobData.amountRead += amountRead;
          }
          // Otherwise, i.e. if the act type is unknown:
          else {
            // Report this.
            addError(true, false, tempReport, actIndex, 'ERROR: Invalid act type');
          }
        }
        // Otherwise, a page URL is required but does not exist, so:
        else {
          // Report this.
          addError(true, false, tempReport, actIndex, 'ERROR: Page has no URL');
        }
      }
      // Otherwise, i.e. if no page exists:
      else {
        // Report this.
        addError(true, false, tempReport, actIndex, 'ERROR: No page identified');
      }
      // Add the end time to the act.
      act.endTime = Date.now();
      // Increment the act count.
      actCount++;
    }
  }
  console.log('Acts completed');
  // If the results were standardized:
  if (['also', 'only'].includes(standard)) {
    // If the native results are not to be included in the report:
    if (standard === 'only') {
      // Remove them.
      tempReport.acts.forEach(act => {
        if (act.result?.nativeResult) {
          delete act.result.nativeResult;
        }
      });
    }
    // If a catalog was created:
    if (tempReport.catalog) {
      let {catalog} = tempReport;
      // Get its element count.
      const elementCount = Object.keys(catalog).length;
      // Prune it, removing elements with no reported violations.
      pruneCatalog(tempReport);
      ({catalog} = tempReport);
      // Get properties of the pruned catalog.
      const textCount = Object.values(catalog).filter(entry => entry.text).length;
      const linkableTextCount = Object.values(catalog).filter(entry => entry.textLinkable).length;
      const entryCount = Object.keys(catalog).length;
      // Initialize a collection of data on it.
      const catalogData = {
        elementCount,
        entryCount,
        text: {
          count: textCount,
          countPercent: Math.round(100 * textCount / entryCount),
          linkableCount: linkableTextCount,
          linkablePercent: Math.round(100 * linkableTextCount / textCount)
        },
        tools: {}
      };
      const {acts} = tempReport;
      // For each act:
      for (const act of acts) {
        // If it is a test act:
        if (act.type === 'test') {
          const {which} = act;
          // Initialize an entry for it if necessary.
          catalogData.tools[which] ??= {
            instanceCount: 0,
            catalogCount: 0,
            catalogPercent: null
          };
          const actCatalogData = catalogData.tools[which];
          const instances = act.result?.standardResult?.instances ?? [];
          // For each standard instance in the act:
          for (const instance of instances) {
            // Increment the instance count.
            actCatalogData.instanceCount++;
            const catalogIndex = instance?.catalogIndex;
            // If the instance has a catalog index:
            if (catalogIndex) {
              // Increment the catalog count.
              actCatalogData.catalogCount++;
            }
          }
          const {catalogCount, instanceCount} = actCatalogData;
          // If there are any instances:
          if (instanceCount) {
            // Add the catalog percentage to the tool data.
            actCatalogData.catalogPercent = Math.round(100 * catalogCount / instanceCount);
          }
        }
      }
      // Add the catalog data to the temporary report.
      tempReport.jobData.catalogData = catalogData;
    }
  }
  // Delete the temporary temporary report file.
  await fs.rm(reportPath, {force: true});
  // Return the temporary report.
  return tempReport;
};
