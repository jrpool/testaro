/*
  © 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  launch.js
  Creates a browser, context, and page and navigates to a URL.
*/

// IMPORTS

// Module to handle errors.
const {addError} = require('./error');
const headedBrowser = process.env.HEADED_BROWSER === 'true';
const {chromium, webkit, firefox} = require('playwright-extra');
const {isBrowserID, isDeviceID, isURL, isValidJob} = require('./job');

// CONSTANTS

// Whether to log page-context log messages.
const debug = process.env.DEBUG === 'true';
// Playwright browser types.
const playwrightBrowsers = {chromium, webkit, firefox};
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
// Seconds to wait between actions.
const waits = Number(process.env.WAITS) ?? 0;

// FUNCTIONS

// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
// Close a browser context and/or its browser, if they exist.
const browserClose = exports.browserClose = async page => {
  if (page) {
    const browserContext = page.context;
    if (browserContext) {
      const {browser} = browserContext;
      try {
        await browserContext.close();
      }
      catch(error) {}
      if (browser) {
        try {
          await browser.close();
        }
        catch(error) {}
      }
    }
  }
};
// Visits a URL and returns the response of the server.
const goTo = exports.goTo = async (report, page, url, timeout, waitUntil) => {
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
// Gets the script nonce from a response.
const getNonce = exports.getNonce = async response => {
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
// Creates a browser, context, and page; navigates to a URL; and returns the page.
const launchOnce = async opts => {
  // Get the arguments. Permitted xPathNeed values are script, attribute, none.
  const {
    report = {},
    actIndex = 0,
    tempBrowserID = '',
    tempURL = '',
    headEmulation = 'high',
    xPathNeed = 'script',
    needsAccessibleName = false
  } = opts;
  const act = report.acts[actIndex] ?? {};
  const {device} = report;
  const deviceID = device?.id;
  const browserID = tempBrowserID || report.browserID || '';
  const url = tempURL || report.target?.url || '';
  let page;
  // If the specified browser and device types and URL are valid:
  if (isBrowserID(browserID) && isDeviceID(deviceID) && isURL(url)) {
    // Replace the report target URL with this URL.
    report.target.url = url;
    // Create a browser of the specified or default type.
    const browserType = playwrightBrowsers[browserID];
    // Define the browser-option args, depending on the browser type and head-emulation level.
    const browserOptionArgs = [];
    if (browserID === 'chromium') {
      browserOptionArgs.push(
        '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'
      );
      if (headEmulation === 'high') {
        browserOptionArgs.push(
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
    let browser, browserContext;
    try {
      // Create a browser of the specified type.
      browser = await browserType.launch(browserOptions);
      // Create a context (i.e. window) for it.
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
      // When a page (i.e. tab) is added to the browser context (i.e. window):
      browserContext.on('page', async page => {
        // Ensure the report has a jobData property.
        report.jobData ??= {};
        const {jobData} = report;
        jobData.logCount ??= 0;
        jobData.logSize ??= 0;
        jobData.errorLogCount ??= 0;
        // When an error is thrown, increment the count of logging errors.
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
        // When the page emits a message:
        page.on('console', msg => {
          const msgText = msg.text();
          // If debugging is on:
          if (debug) {
            // Log the start of the message on the console.
            console.log(`\n${msgText.slice(0, 3000)}`);
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
      // Create a page (tab) of the context (window).
      page = await browserContext.newPage();
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
      // If an XPath computation script is required:
      if (xPathNeed !== 'none') {
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
              if (! parent || parent.nodeType !== Node.ELEMENT_NODE) {
                // Prepend the element (not the parent) to the segment array.
                segments.unshift(tag);
                // Stop traversing, leaving the segment array partial.
                break;
              }
              // Get the subscript of the element if it is not the body element.
              const cohort = Array
              .from(parent.childNodes)
              .filter(
                childNode => childNode.nodeType === Node.ELEMENT_NODE
                && childNode.tagName === element.tagName
              );
              const subscript = tag === 'body' ? '' : `[${cohort.indexOf(element) + 1}]`;
              // Prepend the element identifier to the segment array.
              segments.unshift(`${tag}${subscript}`);
              // Continue the traversal with the parent of the current element.
              element = parent;
            }
            // Return the XPath.
            return `/${segments.join('/')}`;
          };
        });
      }
      // If an accessible-name computation script is needed:
      if (needsAccessibleName) {
        // Add the dom-accessibility-api script to the page to compute an accessible name.
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
          // Add a window method to return a standard instance.
          window.getInstance = (
            element, ruleID, what, count = 1, ordinalSeverity, summaryTagName = ''
          ) => {
            // If an element has been specified:
            if (element) {
              // Get its properties.
              const boxData = element.getBoundingClientRect();
              ['x', 'y', 'width', 'height'].forEach(dimension => {
                boxData[dimension] = Math.round(boxData[dimension]);
              });
              const {x, y, width, height} = boxData;
              const {tagName, id = ''} = element;
              const rawExcerpt = (element.textContent.trim() || element.outerHTML.trim())
              .replace(/\s+/g, ' ');
              const excerpt = rawExcerpt.slice(0, 200);
              // Return an itemized standard instance.
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
            // Otherwise, i.e. if no element has been specified, return a summary instance.
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
      const waitType = xPathNeed === 'none' ? 'domcontentloaded' : 'networkidle';
      // Navigate to the specified URL and wait for the stability required by the next action.
      const navResult = await goTo(report, page, url, 15000, waitType);
      // If the navigation succeeded:
      if (navResult.success) {
        // If XPath attributes are needed:
        if (xPathNeed === 'attribute') {
          // Use the added script to add them.
          await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            elements.forEach(element => {
              element.setAttribute('data-xpath', window.getXPath(element));
            });
          });
        }
        // If the launch was for an act:
        if (act) {
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
      }
      // Otherwise, i.e. if the navigation failed:
      else {
        // Throw an error.
        throw new Error(`Navigation failed (${navResult.error})`);
      }
    }
    // If an error occurred:
    catch(error) {
      // Report this.
      addError(
        true, false, report, actIndex, `ERROR launching or navigating (${error.message})`
      );
      // Close the browser and its context, if they exist.
      await browserClose(page);
      // Return a failure.
      return {
        success: false,
        error: error.message
      };
    }
  }
  // If the launch and navigation succeeded, return the page.
  return {
    success: true,
    page
  };
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
// Manages browser launching and navigating and returns a page.
exports.launch = async (opts = {}) => {
  const {
    report = {},
    actIndex = 0,
    tempBrowserID = '',
    tempURL = '',
    headEmulation = 'high',
    xPathNeed = 'script',
    needsAccessibleName = false,
    retries = 2
  } = opts;
  // If the report is valid:
  const jobValidation = isValidJob(report);
  if (jobValidation.isValid) {
    // Try to launch a browser and navigate to the specified URL.
    let launchResult = await launchOnce(
      {report, actIndex, tempBrowserID, tempURL, headEmulation, xPathNeed, needsAccessibleName}
    );
    // If the launch and navigation succeeded:
    if (launchResult.success) {
      // Return the page.
      return launchResult.page;
    }
    // Otherwise, i.e. if the launch or navigation failed:
    else {
      let retriesLeft = retries;
      // As long as retries remain, decrement the allowed retry count and:
      while (retriesLeft--) {
        const {error} = launchResult;
        // Prepare to wait 1 second before a retry.
        let waitSeconds = 1;
        // If the error was a visit failure due to rate limiting:
        if (error.includes('status429/retryAfterSeconds=')) {
          const waitSecondsRequest = Number(error.replace(/^.+=|\)$/g, ''));
          // If the requested wait is less than 10 seconds:
          if (! Number.isNaN(waitSecondsRequest) && waitSecondsRequest < 10) {
            // Change the wait to the requested one.
            waitSeconds = waitSecondsRequest;
          }
        }
        console.log(
          `WARNING: Waiting ${waitSeconds} sec. before retrying (retries left: ${retries})`
        );
        // Wait as specified.
        await wait(1000 * waitSeconds);
        // Retry the launch and navigation.
        launchResult = await launchOnce(
          {report, actIndex, tempBrowserID, tempURL, headEmulation, xPathNeed, needsAccessibleName}
        );
        // If the launch and navigation succeeded:
        if (launchResult.success) {
          // Return the page.
          return launchResult.page;
        }
        // Otherwise, i.e. if the launch or navigation failed:
        else {
          // If no retries remain:
          if (! retriesLeft) {
            // Report this.
            addError(true, false, report, actIndex, 'ERROR: No retries left');
          }
          // Return a failure.
          return null;
        }
      }
    }
  }
  // Otherwise, i.e. if the report is invalid:
  else {
    // Report this.
    addError(
      true,
      false,
      report,
      actIndex,
      `ERROR: Cannot launch browser for invalid job (${jobValidation.error})`
    );
    // Return a failure.
    return null;
  }
};
