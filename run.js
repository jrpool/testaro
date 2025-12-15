/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool. All rights reserved.

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
  run.js
  Testaro main utility module.
*/

// IMPORTS

// Module to perform file operations.
const fs = require('fs/promises');
// Module to keep secrets.
require('dotenv').config({quiet: true});
// Module to execute shell commands.
const {execSync} = require('child_process');
// Module to validate jobs.
const {isBrowserID, isDeviceID, isURL, isValidJob, tools} = require('./procs/job');
// Module to evade automation detection.
const {chromium, webkit, firefox} = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
webkit.use(StealthPlugin());
firefox.use(StealthPlugin());
const playwrightBrowsers = {chromium, webkit, firefox};
// Module to standardize report formats.
const {standardize} = require('./procs/standardize');
// Module to identify element bounding boxes.
const {identify} = require('./procs/identify');
// Module to send a notice to an observer.
const {tellServer} = require('./procs/tellServer');
// Module to create child processes.
const {fork} = require('child_process');
// Module to set operating-system constants.
const os = require('os');

// CONSTANTS

const headedBrowser = process.env.HEADED_BROWSER === 'true';
const debug = process.env.DEBUG === 'true';
const waits = Number.parseInt(process.env.WAITS) || 0;
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
// Strings in log messages indicating errors.
const errorWords = [
  'but not used',
  'content security policy',
  'deprecated',
  'error',
  'exception',
  'expected',
  'failed',
  'invalid',
  'missing',
  'non-standard',
  'not supported',
  'refused',
  'requires',
  'sorry',
  'suspicious',
  'unrecognized',
  'violates',
  'warning'
];
// Time limits on tools, accounting for page reloads by 6 Testaro tests.
const timeLimits = {
  alfa: 20,
  ed11y: 30,
  ibm: 30,
  testaro: 200 + Math.round(6 * waits / 1000)
};
// Timeout multiplier.
const timeoutMultiplier = Number.parseFloat(process.env.TIMEOUT_MULTIPLIER) || 1;

// Temporary directory
const tmpDir = os.tmpdir();

// ########## VARIABLES

// Facts about the current session.
let actCount = 0;
// Facts about the current act.
let browser;
let cleanupInProgress = false;
let browserCloseIntentional = false;
let browserContext;
let page;
let report;
let requestedURL = '';

// FUNCTIONS

// Returns a string with any final slash removed.
const deSlash = string => string.endsWith('/') ? string.slice(0, -1) : string;
// Gets the script nonce from a response.
const getNonce = async response => {
  let nonce = '';
  // If the response includes a content security policy:
  const headers = await response.allHeaders();
  const cspWithQuotes = headers && headers['content-security-policy'];
  if (cspWithQuotes) {
    // If it requires scripts to have a nonce:
    const csp = cspWithQuotes.replace(/'/g, '');
    const directives = csp.split(/ *; */).map(directive => directive.split(/ +/));
    const scriptDirective = directives.find(dir => dir[0] === 'script-src');
    if (scriptDirective) {
      const nonceSpec = scriptDirective.find(valPart => valPart.startsWith('nonce-'));
      if (nonceSpec) {
        // Return the nonce.
        nonce = nonceSpec.replace(/^nonce-/, '');
      }
    }
  }
  // Return the nonce, if any.
  return nonce;
};
// Normalizes a file URL in case it has the Windows path format.
const normalizeFile = u => {
  if (!u) return u;
  if (!u.toLowerCase().startsWith('file:')) return u;
  // Ensure forward slashes and three slashes after file:
  let path = u.replace(/^file:\/+/i, '');
  path = path.replace(/\\/g, '/');
  return 'file:///' + path.replace(/^\//, '');
};
// Visits a URL and returns the response of the server.
const goTo = async (report, page, url, timeout, waitUntil) => {
  // If the URL is a file path:
  if (url.startsWith('file://')) {
    // Make it absolute.
    url = url.replace('file://', `file://${__dirname}/`);
  }
  // Visit the URL.
  const startTime = Date.now();
  try {
    const response = await page.goto(url, {
      timeout,
      waitUntil
    });
    report.jobData.visitLatency += Math.round((Date.now() - startTime) / 1000);
    const httpStatus = response.status();
    // If the response status was normal:
    if ([200, 304].includes(httpStatus) || url.startsWith('file:')) {
      const actualURL = page.url();
      const actualNorm = actualURL.startsWith('file:') ? normalizeFile(actualURL) : actualURL;
      const urlNorm = url.startsWith('file:') ? normalizeFile(url) : url;
      // If the browser was redirected in violation of a strictness requirement:
      if (report.strict && deSlash(actualNorm) !== deSlash(urlNorm)) {
        // Return an error.
        console.log(`ERROR: Visit to ${url} redirected to ${actualURL}`);
        return {
          success: false,
          error: 'badRedirection'
        };
      }
      // Otherwise, i.e. if no prohibited redirection occurred:
      else {
        // Press the Escape key to dismiss any modal dialog.
        await page.keyboard.press('Escape');
        // Return the result of the navigation.
        return {
          success: true,
          response
        };
      }
    }
    // Otherwise, if the response status was prohibition:
    else if (httpStatus === 403) {
      // Return this.
      console.log(`ERROR: Visit to ${url} prohibited (status 403)`);
      return {
        success: false,
        error: 'status403'
      };
    }
    // Otherwise, if the response status was rejection of excessive requests:
    else if (httpStatus === 429) {
      const retryHeader = response.headers()['retry-after'];
      let waitSeconds = 5;
      if (retryHeader) {
        waitSeconds = Number.isNaN(Number(retryHeader))
        ? Math.ceil((new Date(retryHeader) - new Date()) / 1000)
        : Number(retryHeader);
      }
      // Return this.
      console.log(
        `ERROR: Visit to ${url} rate-limited (status 429); retry after ${waitSeconds} sec.`
      );
      return {
        success: false,
        error: `status429/retryAfterSeconds=${waitSeconds}`
      };
    }
    // Otherwise, i.e. if the response status was otherwise abnormal:
    else {
      // Return an error.
      console.log(`ERROR: Visit to ${url} got status ${httpStatus}`);
      report.jobData.visitRejectionCount++;
      return {
        success: false,
        error: 'badStatus'
      };
    }
  }
  catch(error) {
    if (debug) {
      console.log(`ERROR visiting ${url} (${error.message.slice(0, 200)})`);
    }
    return {
      success: false,
      error: 'noVisit'
    };
  }
};
// Adds an error result to an act.
const addError = (alsoLog, alsoAbort, report, actIndex, message) => {
  // If the error is to be logged:
  if (alsoLog) {
    // Log it.
    console.log(message);
  }
  // Add error data to the result.
  const act = report.acts[actIndex];
  act.result ??= {};
  act.result.success ??= false;
  act.result.error ??= message;
  if (act.type === 'test') {
    act.data ??= {};
    act.data.prevented = true;
    act.data.error = message;
    // Add prevention data to the job data.
    report.jobData.preventions[act.which] = message;
  }
  // If the job is to be aborted:
  if (alsoAbort) {
    // Add this to the report.
    abortActs(report, actIndex);
  }
};
// Closes any current browser.
const browserClose = exports.browserClose = async () => {
  // If a browser exists:
  if (browser) {
    browserCloseIntentional = true;
    // Try to close all its contexts and ignore any messages that they are already closed.
    for (const context of browser.contexts()) {
      try {
        await context.close();
      }
      catch(error) {
      }
    }
    // Close the browser.
    await browser.close();
    browserCloseIntentional = false;
    browser = null;
  }
};
// Launches a browser and navigates to a URL.
const launch = exports.launch = async (
  report, actIndex, headEmulation, tempBrowserID, tempURL, retries = 2
) => {
  const act = report.acts[actIndex] || {};
  const {device} = report;
  const deviceID = device && device.id;
  const browserID = tempBrowserID || report.browserID || '';
  const url = tempURL || report.target && report.target.url || '';
  // If the specified browser and device types and URL exist:
  if (isBrowserID(browserID) && isDeviceID(deviceID) && isURL(url)) {
    // Replace the report target URL with this URL.
    report.target.url = url;
    // Create a browser of the specified or default type.
    const browserType = playwrightBrowsers[browserID];
    // Close any current browser.
    await browserClose();
    // Define the browser-option args, depending on the browser type and head-emulation level.
    const browserOptionArgs = [];
    if (browserID === 'chromium') {
      browserOptionArgs.push(
        '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'
      );
      if (headEmulation === 'high') {
        browserOptionArgs.push(
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--force-device-scale-factor=1',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-background-networking',
          '--force-color-profile=srgb',
          '--disable-features=TranslateUI,VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--disable-logging',
          '--disable-permissions-api',
          '--disable-notifications',
          '--disable-popup-blocking'
        );
      }
    }
    // Define the browser options.
    const browserOptions = {
      logger: {
        isEnabled: () => false,
        log: (name, severity, message) => {
          if (['warning', 'error'].includes(severity)) {
            console.log(`${severity.toUpperCase()}: ${message.slice(0, 200)}`);
          }
        }
      },
      headless: ! headedBrowser,
      slowMo: waits || 0,
      args: browserOptionArgs
    };
    try {
      // Replace the browser with a new one.
      browser = await browserType.launch(browserOptions);
      // Redefine the context (i.e. browser window).
      const contextOptions = {
        ...device.windowOptions,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: device.windowOptions.viewport || {width: 1920, height: 1080},
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Upgrade-Insecure-Requests': '1'
        }
      };
      browserContext = await browser.newContext(contextOptions);
      // Prevent default timeouts.
      browserContext.setDefaultTimeout(0);
      // When a page (i.e. tab) is added to the browser context (i.e. browser window):
      browserContext.on('page', async page => {
        // Ensure the report has a jobData property.
        report.jobData ??= {};
        const {jobData} = report;
        jobData.logCount ??= 0;
        jobData.logSize ??= 0;
        jobData.errorLogCount ??= 0;
        // Add any error events to the count of logging errors.
        page.on('crash', () => {
          jobData.errorLogCount++;
          console.log('Page crashed');
        });
        page.on('pageerror', () => {
          jobData.errorLogCount++;
        });
        page.on('requestfailed', () => {
          jobData.errorLogCount++;
        });
        // If the page emits a message:
        page.on('console', msg => {
          const msgText = msg.text();
          let indentedMsg = '';
          // If debugging is on:
          if (debug) {
            // Log a summary of the message on the console.
            const parts = [msgText.slice(0, 75)];
            if (msgText.length > 75) {
              parts.push(msgText.slice(75, 150));
              if (msgText.length > 150) {
                const tail = msgText.slice(150).slice(-150);
                if (msgText.length > 300) {
                  parts.push('...');
                }
                parts.push(tail.slice(0, 75));
                if (tail.length > 75) {
                  parts.push(tail.slice(75));
                }
              }
            }
            indentedMsg = parts.map(part => `    | ${part}`).join('\n');
            console.log(`\n${indentedMsg}`);
          }
          // Add statistics on the message to the report.
          const msgTextLC = msgText.toLowerCase();
          const msgLength = msgText.length;
          jobData.logCount++;
          jobData.logSize += msgLength;
          if (errorWords.some(word => msgTextLC.includes(word))) {
            jobData.errorLogCount++;
            jobData.errorLogSize += msgLength;
          }
          const msgLC = msgText.toLowerCase();
          if (
            msgText.includes('403') && (msgLC.includes('status')
            || msgLC.includes('prohibited'))
          ) {
            jobData.prohibitedCount++;
          }
        });
      });
      // Reassign the page variable to a new page (tab) of the context (window).
      page = await browserContext.newPage();
      // Wait until it is stable.
      await page.waitForLoadState('domcontentloaded', {timeout: 5000});
      // Add a script to the page to mask automation detection.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        window.chrome = {runtime: {}};
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
      });
      const isTestaroTest = act.type === 'test' && act.which === 'testaro';
      // If the launch is for a testaro test act:
      if (isTestaroTest) {
        // Add a script to the page to add a window method to get the XPath of an element.
        await page.addInitScript(() => {
          window.getXPath = element => {
            if (! element || element.nodeType !== Node.ELEMENT_NODE) {
              return '';
            }
            const segments = [];
            // As long as the current node is an element:
            while (element && element.nodeType === Node.ELEMENT_NODE) {
              const tag = element.tagName.toLowerCase();
              // If it is the html element:
              if (element === document.documentElement) {
                // Prepend it to the segment array
                segments.unshift('html');
                // Stop traversing.
                break;
              }
              // Otherwise, get its parent node.
              const parent = element.parentNode;
              // If (abnormally) the parent node is not an element:
              if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
                // Prepend it to the segment array.
                segments.unshift(tag);
                // Stop traversing, leaving the segment array partial.
                break;
              }
              let subscript = '';
              // Get the subscript of the element.
              const cohort = Array
              .from(parent.childNodes)
              .filter(
                childNode => childNode.nodeType === Node.ELEMENT_NODE
                && childNode.tagName === element.tagName
              );
              if (cohort.length > 1) {
                subscript = `[${cohort.indexOf(element) + 1}]`;
              }
              // Prepend the element identifier to the segment array.
              segments.unshift(`${tag}${subscript}`);
              // Continue the traversal with the parent of the current element.
              element = parent;
            }
            // Return the XPath.
            return `/${segments.join('/')}`;
          };
        });
        // Add a script to the page to compute the accessible name of an element.
        await page.addInitScript({path: require.resolve('./dist/nameComputation.js')});
        // Add a script to the page to:
        await page.addInitScript(() => {
          // Add a window method to compute the accessible name of an element.
          window.getAccessibleName = element => {
            const nameIsComputable = element
            && element.nodeType === Node.ELEMENT_NODE
            && typeof window.computeAccessibleName === 'function';
            return nameIsComputable ? window.computeAccessibleName(element) : '';
          };
          // Add a window method to return an instance.
          window.getInstance = (
            element, ruleID, what, count = 1, ordinalSeverity, summaryTagName = ''
          ) => {
            // If the element exists:
            if (element) {
              // Get its properties.
              const boxData = element.getBoundingClientRect();
              ['x', 'y', 'width', 'height'].forEach(dimension => {
                boxData[dimension] = Math.round(boxData[dimension]);
              });
              const {x, y, width, height} = boxData;
              const {tagName, id = ''} = element;
              const rawExcerpt = element.textContent.trim() || element.outerHTML.trim();
              const excerpt = rawExcerpt.replace(/\s+/g, ' ').slice(0, 200);
              // Return an itemized instance.
              return {
                ruleID,
                what,
                count,
                ordinalSeverity,
                tagName,
                id,
                location: {
                  doc: 'dom',
                  type: 'box',
                  spec: {
                    x,
                    y,
                    width,
                    height
                  }
                },
                excerpt,
                boxID: [x, y, width, height].join(':'),
                pathID: window.getXPath(element)
              };
            }
            // Otherwise, i.e. if no element exists, return a summary instance.
            return {
              ruleID,
              what,
              count,
              ordinalSeverity,
              tagName: summaryTagName,
              id: '',
              location: {
                doc: '',
                type: '',
                spec: ''
              },
              excerpt: '',
              boxID: '',
              pathID: ''
            };
          };
        });
      }
      // Navigate to the specified URL.
      const navResult = await goTo(report, page, url, 15000, 'domcontentloaded');
      // If the navigation succeeded:
      if (navResult.success) {
        // Update the name of the current browser type and store it in the page.
        page.browserID = browserID;
        // Add the actual URL to the act.
        act.actualURL = page.url();
        // Get the response of the target server.
        const {response} = navResult;
        // Add the script nonce, if any, to the act.
        const scriptNonce = await getNonce(response);
        if (scriptNonce) {
          report.jobData.lastScriptNonce = scriptNonce;
        }
      }
      // Otherwise, i.e. if the launch or navigation failed for another reason:
      else {
        // Cause another attempt to launch and navigate, if retries remain.
        throw new Error(`Navigation failed (${navResult.error})`);
      }
    }
    // If an error occurred:
    catch(error) {
      // If retries remain:
      if (retries > 0) {
        // Prepare to wait 1 second before a retry.
        let waitSeconds = 1;
        // If the error was a visit failure due to rate limiting:
        if (error.message.includes('status429/retryAfterSeconds=')) {
          // Change the wait to the requested time, if less than 10 seconds.
          const waitSecondsRequest = Number(error.message.replace(/^.+=|\)$/g, ''));
          if (! Number.isNaN(waitSecondsRequest) && waitSecondsRequest < 10) {
            waitSeconds = waitSecondsRequest;
          }
        }
        console.log(
          `WARNING: Waiting ${waitSeconds} sec. before retrying (retries left: ${retries})`
        );
        await wait(1000 * waitSeconds + 100);
        // Then retry the launch and navigation.
        return launch(report, actIndex, headEmulation, tempBrowserID, tempURL, retries - 1);
      }
      // Otherwise, i.e. if no retries remain:
      else {
        // Report this.
        addError(
          true, false, report, actIndex, `FINAL ERROR launching or navigating (${error.message})`
        );
        // If the browser was created, and thus not a context of it:
        if (browser) {
          // Report this.
          console.log('ERROR: Browser was created but context creation failed');
          // Close the browser.
          await browser.close().catch(() => {
            console.log('ERROR: Could not close browser after context creation failure');
          });
          browser = null;
        }
        page = null;
      }
    };
  }
  // Otherwise, i.e. if the browser or device ID is invalid:
  else {
    // Report this and abort the job.
    addError(
      true,
      true,
      report,
      actIndex,
      `ERROR: Browser ${browserID}, device ${deviceID}, or URL ${url} invalid`
    );
  }
  exports.page = page;
};
// Returns a string representing the date and time.
const nowString = () => (new Date()).toISOString().slice(2, 16);
// Returns the first line of an error message.
const errorStart = error => error.message.replace(/\n.+/s, '');
// Normalizes spacing characters and cases in a string.
const debloat = string => string.replace(/\s/g, ' ').trim().replace(/ {2,}/g, ' ').toLowerCase();
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
// Adds a wait error result to an act.
const waitError = (page, act, error, what) => {
  console.log(`ERROR waiting for ${what} (${error.message})`);
  act.result.found = false;
  act.result.url = page.url();
  act.result.error = `ERROR waiting for ${what}`;
  return false;
};
// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
// Reports a job being aborted.
const abortActs = (report, actIndex) => {
  // Add data on the aborted act to the report.
  report.jobData.abortTime = nowString();
  report.jobData.abortedAct = actIndex;
  report.jobData.aborted = true;
  // Report that the job is aborted.
  console.log(`ERROR: Job aborted on act ${actIndex}`);
};
// Returns the combination of browser ID and target URL of an act.
const launchSpecs = (act, report) => [
  act.browserID || report.browserID || '',
  act.target && act.target.url || report.target && report.target.url || ''
];
// Performs the acts in a report and adds the results to the report.
const doActs = async (report, opts = {}) => {
  const {acts} = report;
  // Get the granular observation options, if any.
  const {onProgress = null, signal = null} = opts;
  // Get the standardization specification.
  const standard = report.standard || 'only';
  const reportPath = `${tmpDir}/report.json`;
  // For each act in the report.
  for (const actIndex in acts) {
    if (signal && signal.aborted) throw new Error('doActs aborted');
    // If the job has not been aborted:
    if (report.jobData && ! report.jobData.aborted) {
      let act = acts[actIndex];
      const {type, which} = act;
      const actSuffix = type === 'test' ? ` ${which}` : '';
      const message = `>>>> ${type}${actSuffix}`;
      // If granular reporting has been specified:
      if (report.observe) {
        const whichParam = which ? `&which=${which}` : '';
        const messageParams = `act=${type}${whichParam}`;
        // If a progress callback has been provided by a caller on this host:
        if (onProgress) {
          // Notify the observer of the act.
          try {
            onProgress({
              type,
              which
            });
            console.log(`${message} (observer notified)`);
          }
          catch (error) {
            console.log(`${message} (observer notification failed: ${errorStart(error)})`);
          }
        }
        // Otherwise, i.e. if no progress callback has been provided:
        else {
          // Notify the remote observer of the act and log it.
          tellServer(report, messageParams, message);
        }
      }
      // Otherwise, i.e. if granular reporting has not been specified:
      else {
        // Log the act.
        console.log(message);
      }
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
            // Quit.
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
        const actLaunchSpecs = launchSpecs(act, report);
        // Launch a browser, navigate to a page, and add the result to the act.
        await launch(
          report,
          actIndex,
          'high',
          actLaunchSpecs[0],
          actLaunchSpecs[1]
        );
        // If this failed:
        if (! page) {
          // Add this to the act.
          act.data ??= {};
          act.data.prevented = true;
          act.data.error = page.error || '';
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
        // Save the report.
        let reportJSON = JSON.stringify(report);
        await fs.writeFile(reportPath, reportJSON);
        // Create a process to perform the act and add the result to the saved report.
        const actResult = await new Promise(resolve => {
          let closed = false;
          const child = fork(
            `${__dirname}/procs/doTestAct`, [actIndex], {timeout: timeoutMultiplier * 1000 * (timeLimits[act.which] || 15)}
          );
          child.on('message', message => {
            if (! closed) {
              closed = true;
              resolve(message);
            }
          });
          child.on('close', code => {
            if (! closed) {
              closed = true;
              resolve(code);
            }
          });
        });
        // Get the revised report.
        reportJSON = await fs.readFile(reportPath, 'utf8');
        report = JSON.parse(reportJSON);
        // Get the revised act.
        act = report.acts[actIndex];
        // If the result is an error code:
        if (typeof actResult === 'number') {
          // Add the error data to the act.
          act.data ??= {};
          act.data.prevented = true;
          act.data.error = actResult;
        }
        // Otherwise, i.e. if it is not an error code:
        else {
          // Add the elapsed time of the tool to the report.
          const time = Math.round((Date.now() - startTime) / 1000);
          const {toolTimes} = report.jobData;
          toolTimes[act.which] ??= 0;
          toolTimes[act.which] += time;
          // If the act was not prevented:
          if (act.data && ! act.data.prevented) {
            // If the act has expectations:
            const expectations = act.expect;
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
      }
      // Otherwise, if a current page exists:
      else if (page) {
        // If the act is navigation to a url:
        if (type === 'url') {
          // Identify the URL.
          const resolved = act.which.replace('__dirname', __dirname);
          requestedURL = resolved;
          // Visit it and wait until the DOM is loaded.
          const navResult = await goTo(report, page, requestedURL, 15000, 'domcontentloaded');
          // If the visit succeeded:
          if (navResult.success) {
            // Revise the report URL to this URL.
            report.target.url = requestedURL;
            // Add the script nonce, if any, to the act.
            const {response} = navResult;
            const scriptNonce = getNonce(response);
            if (scriptNonce) {
              report.jobData.lastScriptNonce = scriptNonce;
            }
            // Add the resulting URL to the act.
            if (! act.result) {
              act.result = {};
            }
            act.result.url = page.url();
            // If a prohibited redirection occurred:
            if (response.exception === 'badRedirection') {
              // Report this.
              addError(true, false, report, actIndex, 'ERROR: Navigation illicitly redirected');
            }
          }
          // Otherwise, i.e. if the visit failed:
          else {
            // Report this.
            addError(true, false, report, actIndex, 'ERROR: Visit failed');
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
              // Quit.
              abortActs(report, actIndex);
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
              // Quit.
              abortActs(report, actIndex);
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
              // Quit.
              abortActs(report, actIndex);
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
            // Report this and abort the job.
            console.log(`ERROR waiting for page to be ${act.which} (${error.message})`);
            addError(true, false, report, actIndex, `ERROR waiting for page to be ${act.which}`);
          });
          // If the wait succeeded:
          if (actIndex > -2) {
            // Add state data to the report.
            act.result = {
              success: true,
              state: act.which
            };
          }
        }
        // Otherwise, if the act is a page switch:
        else if (type === 'page') {
          // Wait for a page to be created and identify it as current.
          page = await browserContext.waitForEvent('page');
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
                      // Add the failure data to the report.
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
                    // Add the failure data to the report.
                    act.result.success = false;
                    act.result.error = 'fewer';
                    act.result.typeElementCount = selections.length;
                    act.result.message = 'Elements of specified type too few';
                  }
                }
                // Otherwise, i.e. if there are no elements of the specified type:
                else {
                  // Add the failure data to the report.
                  act.result.success = false;
                  act.result.error = 'none';
                  act.result.typeElementCount = 0;
                  act.result.message = 'No elements of specified type found';
                }
              }
              // Otherwise, i.e. if the page no longer exists:
              else {
                // Add the failure data to the report.
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
                  // Add the error result to the act and abort the job.
                  addError(true, false, report, actIndex, `ERROR: ${move} failed`);
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
                    const report = `ERROR: could not check ${type} because disabled`;
                    act.result.success = false;
                    act.result.error = report;
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
                    // Quit and add failure data to the report.
                    console.log(`ERROR clicking link (${errorStart(error)})`);
                    act.result.success = false;
                    act.result.error = 'unclickable';
                    act.result.message = 'ERROR: click or load timed out';
                    abortActs(report, actIndex);
                  }
                  // If the link click succeeded:
                  if (! act.result.error) {
                    // Add success data to the report.
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
                report.jobData.presses += what.length;
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
                const report = 'ERROR: move unknown';
                act.result.success = false;
                act.result.error = report;
              }
            }
            // Otherwise, i.e. if no match was found:
            else {
              // Quit and add failure data to the report.
              act.result.success = false;
              act.result.error = 'absent';
              act.result.message = 'ERROR: specified element not found';
              console.log('ERROR: Specified element not found');
              abortActs(report, actIndex);
            }
          }
          // Otherwise, if the act is a keypress:
          else if (type === 'press') {
            // Identify the number of times to press the key.
            let times = 1 + (act.again || 0);
            report.jobData.presses += times;
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
            // Add the totals to the report.
            report.jobData.presses += presses;
            report.jobData.amountRead += amountRead;
          }
          // Otherwise, i.e. if the act type is unknown:
          else {
            // Add the error result to the act and abort the job.
            addError(true, false, report, actIndex, 'ERROR: Invalid act type');
          }
        }
        // Otherwise, a page URL is required but does not exist, so:
        else {
          // Add an error result to the act and abort the job.
          addError(true, false, report, actIndex, 'ERROR: Page has no URL');
        }
      }
      // Otherwise, i.e. if no page exists:
      else {
        // Add an error result to the act and abort the job.
        addError(true, false, report, actIndex, 'ERROR: No page identified');
      }
      // Add the end time to the act.
      act.endTime = Date.now();
    }
  }
  console.log('Acts completed');
  // If standardization is required:
  if (['also', 'only'].includes(standard)) {
    // If granular reporting has been specified:
    if (report.observe) {
      // If a progress callback has been provided:
      if (onProgress) {
        // Notify the observer of the start of standardization.
        try {
          onProgress({
            type: 'standardization',
            which: 'start'
          });
          console.log(`${'Standardization started'} (observer notified)`);
        }
        catch (error) {
          console.log(`${message} (observer notification failed: ${errorStart(error)})`);
        }
      }
      // Otherwise, i.e. if no progress callback has been provided:
      else {
        // Notify the observer of the act and log it.
        tellServer(report, messageParams, message);
      }

    // Notify the observer and log the start of standardization.
    tellServer(report, '', 'Starting result standardization');
    }
    const launchSpecActs = {};
    // For each act:
    report.acts.forEach((act, index) => {
      // If it is a test act:
      if (act.type === 'test') {
        // Classify it by its browser ID and target URL.
        const specs = launchSpecs(act, report);
        const specString = `${specs[0]}>${specs[1]}`;
        if (launchSpecActs[specString]) {
          launchSpecActs[specString].push(index);
        }
        else {
          launchSpecActs[specString] = [index];
        }
      }
    });
    // For each browser ID/target URL class:
    for (const specString of Object.keys(launchSpecActs)) {
      const specs = specString.split('>');
      // Replace the browser and navigate to the URL.
      await launch(
        report,
        'standardization',
        'high',
        specs[0],
        specs[1]
      );
      // If the launch and navigation succeeded:
      if (page) {
        // For each test act in the class:
        for (const specActIndex of launchSpecActs[specString]) {
          const act = report.acts[specActIndex];
          // Initialize the standard result.
          act.standardResult = {
            totals: [0, 0, 0, 0],
            instances: []
          };
          // Populate it.
          standardize(act);
          // Add a box ID and a path ID to each of its standard instances if missing.
          for (const instance of act.standardResult.instances) {
            const elementID = await identify(instance, page);
            if (! instance.boxID) {
              instance.boxID = elementID ? elementID.boxID : '';
            }
            if (! instance.pathID) {
              instance.pathID = elementID ? elementID.pathID : '';
            }
          };
          // If the original-format result is not to be included in the report:
          if (standard === 'only') {
            // Remove it.
            delete act.result;
          }
        };
      }
      // Otherwise, i.e. if the launch or navigation failed:
      else {
        console.log(`ERROR: Launch or navigation to standardize ${specString} acts failed`);
      }
    };
    // Close the last browser launched for standardization.
    await browserClose();
    console.log('Standardization completed');
  }
  // Delete the temporary report file.
  await fs.rm(reportPath, {force: true});
  return report;
};
// Runs a job and returns a report.
exports.doJob = async (job, opts = {}) => {
  // Make a report as a copy of the job.
  report = JSON.parse(JSON.stringify(job));
  const jobData = report.jobData = {};
  // Get whether the job is valid and, if not, why.
  const jobInvalidity = isValidJob(job);
  // If it is invalid:
  if (jobInvalidity) {
    // Report this.
    console.log(`ERROR: ${jobInvalidity}`);
    jobData.aborted = true;
    jobData.abortedAct = null;
    jobData.abortError = jobInvalidity;
  }
  // Otherwise, i.e. if it is valid:
  else {
    // Add initialized job data to the report.
    const startTime = new Date();
    report.jobData.startTime = nowString();
    report.jobData.endTime = '';
    report.jobData.elapsedSeconds = 0;
    report.jobData.visitLatency = 0;
    report.jobData.logCount = 0;
    report.jobData.logSize = 0;
    report.jobData.errorLogCount = 0;
    report.jobData.errorLogSize = 0;
    report.jobData.prohibitedCount = 0;
    report.jobData.visitRejectionCount = 0;
    report.jobData.aborted = false;
    report.jobData.abortedAct = null;
    report.jobData.presses = 0;
    report.jobData.amountRead = 0;
    report.jobData.toolTimes = {};
    report.jobData.preventions = {};
    process.on('message', message => {
      if (message === 'interrupt') {
        console.log('ERROR: Terminal interrupted the job');
        process.exit();
      }
    });
    // Perform the acts with any specified same-host observation options and get a report.
    report = await doActs(report, opts);
    // Add the end time and duration to the report.
    const endTime = new Date();
    report.jobData.endTime = nowString();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
    report.jobData.elapsedSeconds =  elapsedSeconds;
    console.log(`Elapsed seconds: ${elapsedSeconds}`);
    // Consolidate and sort the tool times.
    const {toolTimes} = report.jobData;
    const toolTimeData = Object
    .keys(toolTimes)
    .sort((a, b) => toolTimes[b] - toolTimes[a])
    .map(tool => [tool, toolTimes[tool]]);
    report.jobData.toolTimes = {};
    toolTimeData.forEach(item => {
      report.jobData.toolTimes[item[0]] = item[1];
    });
  }
  // Return the report.
  return report;
};

// CLEANUP HANDLERS

// Force-kills any Playwright browser processes synchronously.
const forceKillBrowsers = () => {
  if (cleanupInProgress) {
    return;
  }
  cleanupInProgress = true;
  try {
    // Kill any Chromium headless shell processes.
    execSync('pkill -9 -f "chromium_headless_shell.*headless_shell"', {stdio: 'ignore'});
  }
  catch(error) {}
};
// Force-kills any headless shell processes synchronously on process exit.
process.on('exit', () => {
  forceKillBrowsers();
});
// Force-kills any headless shell processes synchronously on beforeExit.
process.on('beforeExit', async () => {
  if (!browserCloseIntentional) {
    await browserClose();
  }
  forceKillBrowsers();
});
// Force-kills any headless shell processes synchronously on uncaught exceptions.
process.on('uncaughtException', async error => {
  console.error('Uncaught exception:', error);
  await browserClose();
  forceKillBrowsers();
  process.exit(1);
});
// Force-kills any headless shell processes synchronously on SIGINT.
process.on('SIGINT', async () => {
  await browserClose();
  forceKillBrowsers();
  process.exit(0);
});
// Force-kills any headless shell processes synchronously on SIGTERM.
process.on('SIGTERM', async () => {
  await browserClose();
  forceKillBrowsers();
  process.exit(0);
});
