# testaro

Ensemble testing for web accessibility

## Breaking change notice

Version 68.0.0 introduces major breaking changes.

Any application that has successfully relied on version 67.1.0 is likely to fail if it updates the `testaro` dependency to version 68.0.0 or later. To prevent such failures, pin `testaro` to version 67.1.0 in your `package.json` file.

Revision of this `README` document to reflect version 68.0.0 is in progress but is incomplete.

## Purposes

Testaro is an application that performs ensemble testing of web pages, primarily for accessibility.

The purposes of Testaro are to:

- provide programmatic access to tests defined by multiple tools
- standardize and integrate the reports of the tools

The need for ensemble testing of web accessibility, and the obstacles to it, are discussed in [Accessibility Metatesting: Comparing Nine Testing Tools](https://arxiv.org/abs/2304.07591).

Testaro is described in two papers:

- [How to run a thousand accessibility tests](https://medium.com/cvs-health-tech-blog/how-to-run-a-thousand-accessibility-tests-63692ad120c3)
- [Testaro: Efficient Ensemble Testing for Web Accessibility](https://arxiv.org/abs/2309.10167)

## Functionality

Testaro performs tasks defined by a _job_. Typically, a job identifies the URL of a web page and asks Testaro to call an ensemble of 11 tools to test the page. Testaro adds the results of the testing to the job, thereby converting the job into a _report_.

Testaro can be given a job to perform, in which case it performs the job, delivers the report, and quits.

Alternatively, testaro can run as a daemon, listening for jobs and performing them when they appear.

A practical application that leverages Testaro will use other software to prepare jobs, schedule them, post-process the reports as needed, and manage the report files. Some utilities for such purposes can be found in the [Testilo project](https://www.npmjs.com/package/testilo). One application that leverages Testaro is [Kilotest](https://github.com/jrpool/kilotest).

## Dependencies

Testaro uses:

- [Playwright](https://playwright.dev/) to launch browsers, perform user actions in them, and perform tests
- [playwright-extra](https://www.npmjs.com/package/playwright-extra) and [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth) to make a Playwright-controlled browser more indistinguishable from a human-operated browser and thus make their requests more likely to succeed
- [playwright-dompath](https://www.npmjs.com/package/playwright-dompath) to retrieve XPaths of elements
- [BlazeDiff](https://blazediff.dev/) to measure motion
- [dotenv](https://www.npmjs.com/package/dotenv) to load environment variables

Testaro can perform tests of these _tools_:

- [Accessibility Checker](https://www.npmjs.com/package/accessibility-checker) (IBM)
- [Alfa](https://alfa.siteimprove.com/) (Siteimprove)
- [ASLint](https://www.npmjs.com/package/@essentialaccessibility/aslint) (eSSENTIAL Accessibility)
- [Axe](https://www.npmjs.com/package/axe-playwright) (Deque)
- [Editoria11y](https://github.com/itmaybejj/editoria11y) (Princeton University)
- [HTML CodeSniffer](https://www.npmjs.com/package/html_codesniffer) (Squiz Labs)
- [Nu Html Checker](https://github.com/validator/validator) (World Wide Web Consortium)
- [QualWeb](https://www.npmjs.com/package/@qualweb/core) (University of Lisbon)
- [Testaro](https://www.npmjs.com/package/testaro) (CVS Health)
- [WallyAX](https://www.npmjs.com/package/@wally-ax/wax-dev) (Wally Solutions)
- [WAVE](https://wave.webaim.org/api/) (WebAIM)

For the tools that are open-source, the identified organizations are their principal or original sponsors.

As shown, Testaro is not only an integrator but also one of the 11 integrated tools. That is because it provides about 50 tests of its own, mostly to complement tests provided by the other 10 tools. Some of those Testaro tests are designed to act as approximate alternatives to tests of vulnerable, restricted, or no longer available tools. In all such cases the Testaro tests are independently designed and implemented, without reference to the code of the tests that inspired them.

## Concepts and terms

The main concepts of Testaro are:

- `job`: a document that tells Testaro what to do.
- `act`: one step in a job
- `report`: a job that Testaro has added results to.
- `tool`: one of the (currently 11) testing applications in the ensemble that Testaro has created.
- `rule`: a success or failure criterion defined by a tool (currently about a thousand across all tools).
- `test`: the software that a tool uses to apply a rule.
- `target`: a web page that a job tells Testaro to test.
- `result`: the information that Testaro adds to a job to describe the test outcomes.
- `native result`: the test outcomes of a tool in the native form of that tool.
- `standard result`: the test outcomes of a tool in a uniform Testaro-defined form.
- `catalog`: a collection of data on the HTML elements that fail one or more tests.

## System requirements

Testaro can be installed under a MacOS, Windows, Debian, or Ubuntu operating system.

Testaro is tested with the latest long-term-support version of [Node.js](https://nodejs.org/en/).

Testaro is configured so that, when Playwright or Puppeteer (a dependency of Playwright and of some tools) launches a `chromium` browser, the browser is [sandboxed](https://www.geeksforgeeks.org/ethical-hacking/what-is-browser-sandboxing/) for improved security. That is the default for Playwright and Puppeteer, and Testaro does not override that default. The host must therefore permit sandboxed browsers. Documentation on how to configure an Ubuntu Linux host for this purpose is available in the [`SERVICE.md` file of the Kilotest repository](https://github.com/jrpool/kilotest/blob/main/SERVICE.md#browser-privileges). If you try to run Testaro on a host that prohibits sandboxed browsers, each attempted launch of a `chromium` browser will throw an error with a message complaining about the unavailability of a sandbox.

## Installation

### As an independent application

To install Testaro as an independent application, clone the [Testaro repository](https://github.com/jrpool/testaro). To ensure that the binary browsers of its Playwright dependency get installed, execute `(p)npx playwright install` after executing `(p)npm install`.

To update Testaro when it is an independent application, execute:

```bash
git checkout package-lock.json
git pull
(p)npm run deps
```

### As a dependency

You can make `testaro` a dependency in another application. As noted at the beginning of this file, the entry in `package.json` should be `"testaro": "67.1.0"` if your application has not been designed to work with version 68.0.0 or later.

## Environment configuration

The `.env` file stores your decisions about the environment in which Testaro runs. The variables that can be defined there are:

```conf
# Whether the browsers launched by Testaro should have visible windows.
HEADED_BROWSER=false
# Whether console logging in launched browsers should be mirrored to the Testaro console.
DEBUG=false
# Whether to disable Puppeteer log warnings of a future headless-mode deprecation.
PUPPETEER_DISABLE_HEADLESS_WARNING=true
# How much time, in milliseconds, to insert between Playwright operations for debugging.
WAITS=0
# API key to enable the WAVE tool.
WAVE_KEY=yourwavekey (get it from [WebAim](https://wave.webaim.org/api/)).
# `proTestKit` API key to enable the `npm Package` of the WallyAX tool.
WAX_KEY=yourwaxkey (get it from [WallyAX](https://account.wallyax.com/?ref_app=Developer&app_type=npm)).
#----------------------------
# When Testaro listens for new jobs in a directory:
# Directory where it listens for them.
JOBDIR=../testing/jobs
# Directory into which Testaro saves the reports of those jobs.
REPORTDIR=../testing/reports
# Name of this Testaro instance when it listens for jobs and sends reports to requesting hosts.
AGENT=agentabc
#----------------------------
# When Testaro polls network hosts to ask for new jobs, data on those hosts.
# URL of host 0 to poll.
NETWATCH_URL_0_JOB=http://localhost:3000/api/assignJob/agentabc
# URL of host 0 to which to send progress reports during jobs.
NETWATCH_URL_0_OBSERVE=http://localhost:3000/api/granular/agentabc
# URL of host 0 to which to send completed job reports.
NETWATCH_URL_0_REPORT=http://localhost:3000/api/takeReport/agentabc
# Password to give to host 0 to authenticate this instance.
NETWATCH_URL_0_AUTH=abcxyz
# Which network hosts to poll for jobs (comma-separated list of indices).
NETWATCH_URLS=0
```

## Jobs

Jobs tell Testaro what and how to test.

### Job example

Here is a sample job, showing properties that you can set:

```javaScript
{
  id: 'healthcheck2611', // Job identifier
  what: 'monthly health check', // Job description
  strict: true, // Whether to reject redirections from the target URL
  standard: 'also', // or 'only' or 'no' (whether to report a standard result)
  observe: false, // Whether to send progress notices to requesting hosts
  device: { // Device to emulate
    id: 'iPhone 8',
    windowOptions: {
      reducedMotion: 'no-preference',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/17.4 Mobile/15A372 Safari/604.1',
      viewport: {
        width: 375,
        height: 667
      },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      defaultBrowserType: 'webkit'
    }
  },
  browserID: 'chromium', // or 'webkit' or 'firefox'
  creationTimeStamp: '241229T0537', // When job was created
  executionTimeStamp: '250110T1200', // When job will be ready to be performed
  target: {
    what: 'Real Estate Management',
    url: 'https://abccorp.com/mgmt/realproperty'
  },
  sources: { // Any data the requester chooses to add
    script: 'ts99',
    batch: 'departments',
    mergeID: '7f',
    requester: 'malavu@abccorp.com'
  },
  acts: [ // Steps in this job
    {
      type: 'test', // Act type (the 'test' type performs tests of a tool)
      launch: {}, // Act-specific overrides for the browserID and/or target
      which: 'axe', // ID of the tool
      detailLevel: 2, // An argument required by this tool
      rules: ['landmark-complementary-is-top-level'], // Which rules of the tool to test for
      what: 'Axe'
    },
    {
      type: 'test',
      launch: {
        browserID: 'webkit', // For this act, use Webkit instead of Chromium
        target: { // For this act, test the contact page instead of the home page
          what: 'Real Estate Management contact',
          url: 'https://abccorp.com/mgmt/realproperty/contactus'
        }
      },
      which: 'qualWeb',
      withNewContent: false,
      rules: ['QW-BP25', 'QW-BP26']
      what: 'QualWeb'
    }
  ]
}
```

The `device` property lets you choose among [about 125 devices recognized by Playwright](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json).

There are 18 act types. They and their options are documented in the `etc` property of the [actSpecs.js](actSpecs.js) object. Documentation for the `actSpecs.js` file is located in the `actSpecs-doc.md` file.

### Running jobs

#### Immediate job execution

An application can execute a job with::

```javascript
const {doJob} = require('testaro/run');
doJob(job)
.then(report => {
  // Process the report.
});
```

A user can make Testaro execute a job with a command like either of:

```bash
node call run
node call run 250725T
```

#### Directory-watched job execution

An application can watch a directory for jobs with::

```javaScript
const {dirWatch} = require('testaro/dirWatch');
dirWatch(true, 300);
```

A user can make Testaro watch a directory for jobs with::

```javaScript
node call dirWatch true 300
```

In both cases, the first argument of `dirWatch` tells Testaro whether to continue watching after performing one job, and the second argument tells Testaro how many secods to wait after not finding a job to perform.

Except for the first (`doJob`) case, Testaro finds a file containing a job in the `todo` subdirectory of the `process.env.JOBDIR` directory and saves the report of that job in the `done/raw` subdirectory. In the `node call run` case, the job selected will be the first one whose file name begins with the argument of `run`, or the first one if that argument is absent.

#### Network-watched job execution

Testaro can poll servers for jobs to be performed. Such a server can act as the “controller” described in [How to run a thousand accessibility tests](https://medium.com/cvs-health-tech-blog/how-to-run-a-thousand-accessibility-tests-63692ad120c3). The server is responsible for preparing Testaro jobs, assigning them to Testaro agents, receiving reports back from those agents, and performing any further processing of the reports, including enhancement, storage, and disclosure to audiences. It can be any server reachable with a URL. That includes a server running on the same host as Testaro, with a URL such as `localhost:3000`.

To make Testaro poll a server for jobs, define the following environment variables, replacing `0` wih any integer:

- `NETWATCH_URL_0_JOB`: which URL to poll (the URL must contain the value of the `AGENT` environment variable)
- `NETWATCH_URL_0_OBSERVE`: which URL to send progress messages to, if requested, during job execution
- `NETWATCH_URL_0_REPORT`: which URL to send job reports to
- `NETWATCH_URL_0_AUTH`: the password to supply to the server when polling and when delivering a report
- `NETWATCH_URLS`: the integer IDs of the servers to be polled, comma-delimited (e.g., `0,3,4`)

The job request sent to the server can be a `POST` request, in which the `agentPW` property of the payload will be the password. Or it can be a `GET` request with the URL containing the password.

Testaro will send the report as a `POST` request whose payload is a JSON object with two properties: `agentPW` (the password) and `report` (the report). However, if the environment does not contain a password, the payload is a JSON object containing only the report.

An application can watch the network for jobs with:

```javaScript
const {netWatch} = require('testaro/netWatch');
netWatch(true, 300, true);
```

A user can make Testaro watch the network for jobs with:

```bash
node call netWatch true 300 true
```

The first argument of `netWatch` tells Testaro whether to continue watching after performing the first job. The second argument tells Testaro how many seconds to wait after receiving a no-jobs response. The third argument tells Testaro whether to be certificate-tolerant, i.e. to accept SSL certificates that fail verification against a list of certificate authorities (the default is `true`).

## Reports

A report is a job with information about the results of the performance of the job inserted by Testaro into the job.

### Whole-job insertions

As Testaro performs a job, information about the job as a whole is inserted into the job. That information is organized into one or two properties:

- `jobData`: Miscellaneous facts about the completed job
- `catalog`: A collection of data about the elements on the target that failed any test(s)

Testaro inserts the `jobData` property into every job, but inserts the `catalog` property only into jobs that instruct Testaro to produce standard results.

#### Catalog

Whenever a job requires any testing and requires the production of standard results, Testaro inserts a _catalog_ into the report before calling any of the testing tools. The catalog is an inventory of HTML elements in the DOM of the target.

The `catalog` property has an object value. Here is an example:

```javascript
'123': {
  tagName: 'SUMMARY',
  id: 'functionsummary',
  startTag: '<summary>',
  text: 'Functional\nAlways active',
  textLinkable: true,
  boxID: '46:230:860:263',
  pathID: '/html/body/div[1]/div[1]/div[3]/div[2]/details[1]/summary[1]'
},
```

If the inner text of the element consists of only one line, that is the value of `text`. If the inner text consists of two or more lines, `text` is the first and last of these, delimited with a newline.

The `textLinkable` property has a true value whenever `text` is non-empty and can generate a text-fragment URL that uniquely identifies an element.

The segments of `boxID` are `x`, `y`, `width`, and `height`.

The catalog is a mechanism for the integration of the tools. Most rule violations that tools report are blamed on particular HTML elements. A tool typically reports that an element violated a rule by having some defect in its configuration or behavior. But tools describe elements differently. Testaro makes the tools identify the XPaths of the elements they report as violators. Testaro then finds, for each XPath, the correct catalog entry.

Testaro uses the following techniques to make the tools calculate XPaths:

- `alfa` and `aslint`: They report XPaths, so Testaro needs only to normalize them.
- `ed11y`: Testaro adds it and a `window.getXPath` method to the page; when the tool reports an element, Testaro computes its XPath.
- `wave`: It reports a selector for each element; Testaro finds each element in the page via its selector and executes `window.getXPath` on the element.
- `axe`, `htmlcs`, `ibm`, `nuVal`, `nuVnu`, `qualWeb`, `wax`: Testaro adds `data-xpath` attributes to all elements; the tools include code excerpts, with the `data-expath` attributes, in the reported violations.
- `testaro`: Testaro designs each of its own tests to report element XPaths.

By attaching a catalog entry to each reported element, Testaro allows an application that uses Testaro to tell users, for any particular HTML element, which tools ascribed violations of which rules to that element. An application could, for example, use a screenshot or a text-fragment link or could ask the user to paste the XPath into a browser developer tool.

In some cases no catalog entry can be found. The reasons may include:

- The element was dynamically created after the catalog was created.
- The element is inside a `noscript` element and therefore not considered an element in the DOM.
- The violation is not ascribed to a single element.

### Act insertions

As Testaro performs the acts of a job, information about the results of each act is inserted into that act. For acts of type `test`, the added properties are:

- `startTime`: When Testaro began to perform the act
- `actualURL`: The tested URL (different from the target URL if the request was redirected)
- `data`: Data generated by the tool
- `result`: Results of the testing by the tool

The `result` property is an object with one or two (depending on the value of `standard`, as described above) subproperties:

- `nativeResult`: The result (or a compact version of the result) natively produced by the tool
- `standardResult`: A Testaro-standardized version of the result

If an act of type `test` contains an `expect` property (specifying expectations about the result), then Testaro also inserts these properties into the act:

- `expectations`: Data on what was expected versus the actual result
- `expectationFailures`: The count of failed expectations

Details about these expectation properties are documened in the `VALIDATION.md` file.

#### Standard results

If the job instructs Testaro to include standard results, then the `result.standardResult` property of each act of type `test` will have three properties:

- `prevented`: Whether the tool was prevented from performing the act
- `totals`: An array of 4 integers, counting the rule violations at 4 severity levels
- `instances`: An array of data about the violations reported by the tool

More specifically:

- The `totals` value is an array like this: `[3, 0, 87, 4]`. This example would mean that the tool reported 3 failures at severity 0 (the least severe level), none at severity 1, 87 at severity 2, and 4 at severity 3. These four severities are conceptually ordinal, not metric.
- The `instances` value is an array of objects, each having these properties:
  - `ruleId`: The ID of the rule that was violated
  - `what`: A description of the rule or of the violation
  - `ordinalSeverity`: The severity of the violation
  - `count`: How many violations of the rule this instance reports
  - `catalogIndex`: Key of the HTML element in the catalog

If no catalog entry was found for the instance, then instead of a `catalogIndex` property Testaro tries to insert a `pathID` property, whose value is a normalized XPath of the offending HTML element.

## Tool details

The tools whose tests Testaro performs have particularities described below.

### ASLint

The `aslint` tool makes use of the [`aslint-testaro` fork](https://www.npmjs.com/package/aslint-testaro) of the [`aslint` repository](https://github.com/essentialaccessibility/aslint), which, unlike the published `aslint` package, contains the `aslint.bundle.js` file.

### HTML CodeSniffer

The `htmlcs` tool makes use of the `htmlcs/HTMLCS.js` file. That file was created, and can be recreated if necessary, as follows:

1. Clone the [HTML CodeSniffer package](https://github.com/squizlabs/HTML_CodeSniffer).
1. Make that package’s directory the active directory.
1. Install the HTML CodeSniffer dependencies by executing `npm install`.
1. Build the HTML CodeSniffer auditor by executing `grunt build`.
1. Copy the `build/HTMLCS.js` and `build/licence.txt` files into the `htmlcs` directory of Testaro.
1. Edit the Testaro copy of `htmlcs/HTMLCS.js` to produce the changes shown below.

The changes in `htmlcs/HTMLCS.js` are:

```diff
479a480
>     '4_1_2_attribute': 'attribute',
6482a6484
>     var messageStrings = new Set();
6496d6497
<         console.log('done');
6499d6499
<         console.log('done');
6500a6501
>       return Array.from(messageStrings);
6531c6532,6534
<       console.log('[HTMLCS] ' + typeName + '|' + msg.code + '|' + nodeName + '|' + elementId + '|' + msg.msg + '|' + html);
---
>       messageStrings.add(
>         typeName + '|' + msg.code + '|' + nodeName + '|' + elementId + '|' + msg.msg + '|' + html
>       );
```

### Accessibility Checker

The `ibm` tests require the `aceconfig.js` file.

As of 2 March 2023 (version 3.1.45 of `accessibility-checker`), the `ibm` tool threw errors when hosted under the Windows operating system. To prevent these errors, it was possible to edit two files in the `accessibility-checker` package as follows:

In `node_modules/accessibility-checker/lib/ACEngineManager.js`, remove or comment out these lines starting on line 169:

```javaScript
if (nodePath.charAt(0) !== '/') {
    nodePath = "../../" + nodePath;
}
```

In `node_modules/accessibility-checker/lib/reporters/ACReporterJSON.js`, add these lines starting on line 106, immediately before the line `var resultsFileName = pathLib.join(resultDir, results.label + '.json');`:

```javaScript
// Replace the colons in the label with hyphen-minuses.
results.label = results.label.replace(/:/g, '-');
```

These changes were proposed as [pull requests 1333 and 1334](https://github.com/IBMa/equal-access/pulls).

The `ibm` tool is one of two tools (`testaro` is the other) with a `withItems` property. If you set `withItems` to `false`, the result includes the counts of “violations” and “recommendations”, but no information about the rules that gave rise to them.

In a previous version of the package, the tool operated on the page content when the `withNewContent` property was `false`. In some cases the tool threw untrappable errors for some targets under that condition. The tool launched a Puppeteer browser to create pages to perform its tests on. On any host that did not permit sandboxed browsers to be launched, the `aceconfig.js` file needed to specify nonsandboxed browsers. Starting in December 2025, the tool operates on the page rather than the page content.

### Nu Html Checker

The `nuVal` and `nuVnu` tools perform the tests of the Nu Html Checker.

Its `rules` argument is **not** an array of rule IDs, but instead is an array of rule _specifications_. A rule specification for `nuVal` or `nuVnu` is a string with the format `=ruleID` or `~ruleID`. The `=` prefix indicates that the rule ID is invariable. The `~` prefix indicates that the rule ID is variable, in which case the `ruleID` part of the specification is a matching regular expression, rather than the exact text of a message. This `rules` format arises from the fact that `nuVal` and `nuVnu` generate customized messages and do not accompany them with rule identifiers.

### QualWeb

The `qualWeb` tool performs the ACT rules, WCAG Techniques, and best-practices tests of QualWeb. Only failures and warnings are included in the report. The EARL report of QualWeb is not generated, because it is equivalent to the report of the ACT rules tests.

QualWeb allows specification of rules for 3 modules: `act-rules`, `wcag-techniques`, and `best-practices`. If you include a `rules` argument in a QualWeb test act, its value must be an array of 1, 2, or 3 strings. Any string in that array is a specification for one of these modules. The string has this format:

```javascript
'mod:m,n,o,p,…'
```

In that format:

- Replace `mod` with `act`, `wcag`, or `best`.
- Replace `m`, `n`, `o`, `p`, etc. with the 0 or more integers that identify rules.

For example, `'best:6,11'` would specify that QualWeb is to test for `best-practices` rules `QW-BP6` and `QW-BP11`, but not for any other `best-practices` rules.

When a string contains only a module prefix and no integers, such as `best:`, it specifies that the module is not to be run at all.

When no string pertains to a module, then QualWeb will test for all of the rules in that module.

Thus, when the `rules` argument is omitted, QualWeb will test for all of the rules in all of these modules.

The target can be provided to QualWeb either as HTML or as a URL. Experience indicates that the results can differ between these methods, with each method reporting some rule violations or some instances that the other method does not report. For at least some cases, more rules are reported violated when HTML is provided (`withNewItems: false`).

QualWeb creates sandboxed Puppeteer pages to perform its tests on. Therefore, the host must permit sandboxed browsers to be launched. See the pertinent [Kilotest documentation](https://github.com/jrpool/kilotest/blob/main/SERVICE.md#browser-privileges) for information about the configuration of an Ubuntu Linux host for this purpose.

### Testaro

The rules that Testaro can test for are implemented in files within the `testaro` directory.

The Testaro rules are classified by an `allRules` array defined in the `tests/testaro.js` file. Each item in that array is an object with these properties:

- `id`: the rule ID.
- `what`: a description of the rule.
- `contaminates`: whether the test for the rule modifies the page, requiring the next test to launch a new browser for test isolation
- `needsAccessibleName`: whether the rule requires an added script adding an accessible-name computation method to `window`
- `timeOut`: the maximum time in seconds allowed for a test of the rule
- `defaultOn`: whether the rule is to be tested for by default

If you do not specify rules when using the `testaro` tool, Testaro will test for its default rules, in the order in which they appear in the array.

The optional `rules` argument for a `testaro` test act is an array whose first item is either `'y'` or `'n'` and whose remaining items are rule IDs. If `'y'`, then only the specified rules’ tests are performed. If `'n'`, then all the default rules are tested for, **except** for the specified rules.

The `testaro` tool (like the `ibm` tool) has a `withItems` property. If you set it to `false`, the `standardResult` object will contain an `instances` property with summaries that identify issues and instance counts. If you set it to `true`, some of the instances will be itemized.

Unlike any other tool, the `testaro` tool requires a `stopOnFail` property, which specifies whether a failure to conform to any rule (i.e. any value of `totals` other than `[0, 0, 0, 0]`) should terminate the execution of tests for the remaining rules.

Tests of the `testaro` tests (i.e. _validation_) can be performed as documented in the `VALIDATION.md` file.

### WallyAX

If a `wax` test act is included in the job, an environment variable named `WAX_KEY` must exist, with your WallyAX API key as its value. You can obtain it from [WallyAX](https://account.wallyax.com/?ref_app=Developer&app_type=npm).

The `wax` tool imposes a limit on the size of a page to be tested. If the page exceeds the limit, Testaro treats the page as preventing `wax` from performing its tests. The limit is less than 500,000 characters.

### WAVE

If a `wave` test act is included in the job, the WAVE tests will be performed either by the subscription API or by the stand-alone API.

If you want the subscription API to perform the tests, you must get a WAVE API key from [WebAIM](https://wave.webaim.org/api/) and assign it as the value of an environment variable named `WAVE_KEY`. The subscription API does not accept a transmitted document for testing. WAVE must be given only a URL, which it then visits to perform its tests. Therefore, you cannot manipulate a page and then have WAVE test it, or ask WAVE to test a page that cannot be reached directly with a URL.

If you want the stand-alone API to perform the tests, you need to have that API installed and running, and the `wave` test act needs to define the URL of your stand-alone API. The test act can also define a `prescript` script and/or a `postscript` script.

## Contribution

You can define additional Testaro rules and functionality. Contributions are welcome.

Please report any issues, including feature requests, at the [repository](https://github.com/jrpool/testaro/issues).

## Accessibility principles

The rationales motivating the Testaro-defined tests can be found in comments within the files of those tests, in the `testaro` directory. Unavoidably, each test is opinionated. Testaro itself, however, can accommodate other tests representing different opinions. Testaro is intended to be neutral with respect to questions such as the criteria for accessibility, the severities of accessibility defects, whether accessibility is binary or graded, and the distinction between usability and accessibility.

## Challenges

### Abnormal termination

On some occasions a test throws an error that cannot be handled with a `try`-`catch` structure. It has been observed, for example, that the `ibm` test does this when the page content, rather than the page URL, is given to `getCompliance()` and the target is `https://globalsolutions.org`, `https://monsido.com`, or `https://www.ambetterhealth.com/`.

Some tools take apparently infinite time to perform their tests on some pages. One website whose pages prevent 5 of the tools from ever completing their tests is the site of BrowserStack.

To handle such fatal errors and stalls, Testaro runs the tests of each tool in a separate forked child process that executes the `procs/doTestAct.js` module. The parent process subjects each tool to a time limit and kills the child if the time limit expires.

### Activation

Testing to determine what happens when a control or link is activated is straightforward, except in the context of a comprehensive set of tests of a single page. There, activating a control or link can change the page or navigate away from it, interfering with the remaining planned tests of the page.

The Playwright “Receives Events” actionability check does **not** check whether an event is dispatched on an element. It checks only whether a click on the location of the element makes the element the target of that click, rather than some other element occupying the same location.

### Test prevention

Test targets employ mechanisms to prevent scraping, multiple requests within a short time, automated form submission, and other automated actions. These mechanisms may interfere with testing. When a test act is prevented by a target, Testaro reports this prevention.

Some targets prohibit the execution of alien scripts unless the client can demonstrate that it is the requester of the page. Failure to provide that evidence results in the script being blocked and an error message being logged, saying “Refused to execute a script because its hash, its nonce, or unsafe-inline does not appear in the script-src directive of the Content Security Policy”. This mechanism affects tools that insert scripts into a target in order to test it. To comply with this requirement, Testaro obtains a _nonce_ from the response that serves the target. Then the file that runs the tool adds that nonce to the script as the value of a `nonce` attribute when it inserts its script into the target.

### Tool duplicativity

Tools sometimes do redundant testing, in that two or more tools test for the same defects, although such duplications are not necessarily perfect. This fact creates problems:

- One cannot be confident in excluding some tests of some tools on the assumption that they perfectly duplicate tests of other tools.
- The Testaro report from a job documents each tool’s results separately, so a single defect may be documented in multiple locations within the report, making the direct consumption of the report inefficient.
- An effort to aggregate the results into a single score may distort the scores by inflating the weights of defects that happen to be discovered by multiple tools.
- Tools use different methods for identifying the locations of elements that violate tool rules.

### Tool malfunctions

Tools can become faulty. For example, Alfa stopped reporting any rule violations in mid-April 2024 and resumed doing so at the end of April. In some cases, such as this, the tool maker corrects the fault. In others, the tool changes and forces Testaro to change its handling of the tool.

### Dependency deployment

The behavior of Testaro as a dependency of an application deployed on a virtual private server has been observed to be vulnerable to slower performance and more frequent test preventions than when Testaro is deployed as a stand-alone application on a workstation. The configuration of Testaro has been tuned for mitigation of such behaviors.

### Containerized deployment

Experimental deployments of Testaro as a dependency in a containerized application has sometimes resulted in thrown errors that are not thrown when the same application is deployed without containerization.

### Headless browser fidelity

Testaro normally performs tests with headless browsers. Some experiments appear to have shown that some test results are inaccurate with headless browsers, but this has not been replicated. The `launch` function in the `run` module accepts a `headEmulation` argument with `'high'` and `'low'` values. Its purpose is to permit optimizations of headless browsers to be turned off, so browsers behave and appear more similar to headed browsers. Observation has failed to show any performance cost, so `'high'` is the default value.

## Repository exclusions

The files in the `temp` directory are presumed ephemeral and are not tracked by `git`.

## Related work

### Testilo

[Testilo](https://www.npmjs.com/package/testilo) is an application that:

- converts lists of targets and lists of issues into jobs
- produces scores and adds them to the raw reports of Testaro
- produces human-oriented HTML digests from scored reports
- produces human-oriented HTML comparisons of the scores of targets

Testilo contains procedures that reorganize report data by issue and by element, rather than tool, and that compensate for duplicative tests when computing scores.

Report standardization could be performed by other software rather than by Testaro. That would require sending the original reports to the server. They are typically larger than standardized reports. Whenever users want only standardized reports, the fact that Testaro standardizes them eliminates the need to send the original reports anywhere.

## Code style

The JavaScript code in this project generally conforms to the ESLint configuration file `.eslintrc.json`. However, the `htmlcs/HTMLCS.js` file implements an older version of JavaScript. Its style is regulated by the `htmlcs/.eslintrc.json` file.

## History

Work on the `testaro` tests in this package began in 2017, and work on the multi-package ensemble that Testaro implements began in early 2018. These two aspects were combined into an “Autotest” package in early 2021 and into the more single-purpose packages, Testaro and Testilo, in January 2022.

On 12 February 2024 ownership of the Testaro repository was transfered from the personal account of contributor Jonathan Pool to the organization account `cvs-health` of CVS Health. The MIT license of the [repository](https://github.com/cvs-health/testaro) did not change, but the copyright holder changed to CVS Health.

Maintenance of the repository owned by CVS Health came to an end on 30 September 2025. The current repository was forked from the `cvs-health` repository in October 2025 and then unlinked from the fork network, by agreement with CVS Health.

## Contributing

From 12 February 2024 through 30 September 2025, contributors of code to Testaro executed a [CVS Health OSS Project Contributor License Agreement](https://forms.office.com/pages/responsepage.aspx?id=uGG7-v46dU65NKR_eCuM1xbiih2MIwxBuRvO0D_wqVFUQ1k0OE5SVVJWWkY4MTVJMkY3Sk9GM1FHRC4u) for Testaro before any pull request was approved and merged.

## Future work

Future work on this project is being considered. Strategic recommendations for such work are recorded in the `UPGRADES.md` file.

## Etymology

“Testaro” means “collection of tests” in Esperanto.

## License

© 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
© 2025–2026 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT
