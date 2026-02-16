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

### Independent application

To install Testaro as an independent application, clone the [Testaro repository](https://github.com/jrpool/testaro). To ensure that the binary browsers of its Playwright dependency get installed, execute `(p)npx playwright install` after executing `(p)npm install`.

To update Testaro when it is an independent application, execute:

```bash
git checkout package-lock.json
git pull
(p)npm run deps
```

### Dependency

You can make `testaro` a dependency in another application. As noted at the beginning of this file, the entry in `package.json` should be `"testaro": "67.1.0"` if your application has not been designed to work with version 68.0.0 or later.

## Configuration

### Environment

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

### Jobs

Jobs tell Testaro what and how to test. Here is a sample job, showing properties that you can set:

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

There are 18 act types. They and their options are documented in the `etc` property of the [actSpecs.js](actSpecs.js) object. Acts of type `test` may have additional configuration properties depending on which tool they employ. Those additional properties are documented in the `test` property of the same object.

## Reports

A report is a job with information about the results of the performance of the job inserted by Testaro into the job.

### Whole-job insertions

As Testaro performs a job, information about the job as a whole is inserted into the job. That information is organized into one or two properties:

- `jobData`: Miscellaneous facts about the completed job
- `catalog`: A collection of data about the elements on the target that failed any test(s)

Testaro inserts the `jobData` property into every job, but inserts the `catalog` property only into jobs that instruct Testaro to produce standard results.

#### Catalogs

Whenever a job requires any testing and requires the production of standard results, Testaro inserts a _catalog_ into the report. The catalog is an inventory of all HTML elements in the DOM of the target. The catalog is a critical mechanism for the integration of the tools. Most rule violations that tools report are blamed on particular HTML elements. A tool typically reports that an element violated a rule by having some defect in its configuration or behavior. But tools describe elements differently, so Testaro needs to be able to determine whether violations reported by different tools are ascribed to the same element. If they are, then an application that uses Testaro can tell you, for any particular HTML element, which tools ascribed violations of which rules to that element.

To make the catalog work, Testaro tries to discover, when a tool reports an element violating a rule, the location in the catalog of the record about that violating element.

The `catalog` property has an object value. Each property of a catalog has a stringified integer as its key (the index of an HTML element in the page document) and an object as its value. That object documents the HTML element. When first created, the catalog documents every element in the DOM. At the end of a job, Testaro deletes all properties of the catalog except those that document elements that failed at least one test of at least one tool. The element-documenting object has these properties:

- `tagName`: The upper-case tag name of the element
- `id`: The value of the `id` prooperty of the element, if any
- `startTag`: The HTML of the opening or complete tag of the element
- `text`: The starting and (if any) ending inner text fragments of the element
- `textLinkable`: Whether the `text` property is non-empty and, if it is, whether it is unique on the page
- `boxID`: The x, y, width, and height of the client bounding rectangle of the element, in `'20:46:203:49'` format
- `pathID`: The XPath of the element, in a Testaro-uniform format

Together, these properties of any reportedly violating HTML element help any application that uses Testaro to show you, in various ways, which element a tool blames for any violation. The application could use a screenshot or a text-fragment link or could ask you to paste the XPath into your browser developer tool, for example.

The discovery process involves ensuring that every violation report that a tool ascribes to an HTML element contains the XPath of that element. Testaro can then use that XPath to find the aapplicable catalog entry.

In some cases no catalog entry can be found. The reasons may include:

- The element was dynamically created after the catalog was created.
- The element is inside a `noscript` element and therefore not considerd an element in the DOM.
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

#### Standard results

If the job instructs Testaro to include standard results, then the `result.standardResult` property of each act of type `test` will have three properties:

- `prevented`: Whether the tool was prevented from performing the act
- `totals`: An array of 4 integers, counting the failures at 4 severity levels
- `instances`: An array of data about the failures reported by the tool

More specifically:

- The `totals` value is an array like this: `[3, 0, 87, 4]`. This example would mean that the tool reported 3 failures at severity 0 (the least severe level), none at severity 1, 87 at severity 2, and 4 at severity 3. These four severities are conceptually ordinal, not metric.
- The `instances` value is an array of objects, each having these properties:
  - `ruleId`: The ID of the rule that was violated
  - `what`: A description of the rule or of the violation
  - `ordinalSeverity`: The severity of the violation
  - `count`: How many violations of the rule this instance reports\
  - `catalogIndex`: If a property in the catalog documents the offending HTML element, its key

If no catalog entry was found for the instance, then instead of a `catalogIndex` property Testaro tries to insert a `pathID` property, whose value is a normalized XPath of the failing HTML element.

##### Element identification

While the above properties can help you find the offending element, Testaro makes this easier by adding, where practical, three standard element identifiers to each standard instance:

- `boxID`: a compact representation of the x, y, width, and height of the element bounding box, if the element can be identified and is visible.
- `pathID`: the XPath of the element, if the element can be identified.
- `text`: the text content of the element, if the element can be identified.

These standard identifiers can help you determine whether violations reported by different tools belong to the same element or different elements. The `boxID` property can also support the making of images of the violating elements.

Some tools limit the efficacy of the current algorithm for standard identifiers:

- HTML CodeSniffer does not report element locations, and the reported code excerpts exclude all text content.
- Nu Html Checker reports line and column boundaries of element start tags and truncates element text content in reported code excerpts.

Testaro aims to overcome these limitations by inserting uniquely identifying attributes into all elements of the pages being tested by these tools. Those attribute values permit Testaro to identify the elements in the tested page. Except for elements excluded from the DOM, such as descendants of `noscript` elements, this mechanism allows Testaro to provide a `pathID` property in almost all standard instances. The `boxID` property is less universal, since some elements, such as `script` elements and hidden elements, have no bounding boxes.

Testing can change the pages being tested, and such changes can cause a particular element to change its physical or logical location. In such cases, an element may appear multiple times in a tool report with different `boxID` or `pathID` values, even though it is, for practical purposes, the same element.

##### Standardization configuration

Each job specifies how Testaro is to handle report standardization. A job contains a `standard` property, with one of the following values to determine which results the report will include:

- `'also'`: original and standard.
- `'only'`: standard only.
- `'no'`: original only.

If a tool has the option to be used without itemization and is being so used, the `instances` array may be empty, or may contain one or more summary instances. Summary instances disclose the numbers of instances that they summarize with the `count` property. They typically summarize violations by multiple elements, in which case their `id`, `location`, `excerpt`, `boxID`, and `pathID` properties will have empty values.

##### Standardization opinionation

This standard format reflects some judgments. For example:

- The `ordinalSeverity` property of an instance involves interpretation. Tools may report severity, certainty, priority, or some combination of those. They may use ordinal or metric quantifications. If they quantify ordinally, their scales may have more or fewer than 4 ranks. Testaro coerces each tool’s severity, certainty, and/or priority classification into a 4-rank ordinal classification. This classification is deemed to express the most common pattern among the tools.
- The `tagName` property of an instance may not always be obvious, because in some cases the rule being tested for requires a relationship among more than one element (e.g., “An X element may not have a Y element as its parent”).
- The `ruleID` property of an instance is a matching rule if the tool issues a message but no rule identifier for each instance. The `nuVal` and `nuVnu` tools do this. In this case, Testaro is classifying the messages into rules.
- The `ruleID` property of an instance may reclassify tool rules. For example, if a tool rule covers multiple situations that are dissimilar, that rule may be split into multiple rules with distinct `ruleID` properties.

You are not dependent on the judgments incorporated into the standard format, because Testaro can give you the original reports from the tools as the `result` property of a `test` act.

The standard format does not express opinions on issue classification. A rule ID identifies something deemed to be an issue by a tool. Useful reporting from ensemble testing still requires the classification of tool **rules** into **issues**. If tool `A` has `alt-incomplete` as a rule ID and tool `B` has `image_alt_stub` as a rule ID, Testaro does not decide whether those are really the same issue or different issues. That decision belongs to you. The standardization of tool reports by Testaro eliminates some of the drudgery in issue classification, but not any of the judgment required for issue classification.

## Tools

##### Introduction to tools

An act of type `test` performs the tests of a tool and reports a result. The result may indicate that a page passes or fails requirements. Typically, accessibility tests report successes and failures. But a test in Testaro is defined less restrictively, so it can report any result. As one example, the Testaro `elements` test reports facts about certain elements on a page, without asserting that those facts are successes or failures.

The `which` property of a `test` act identifies a tool, such as `alfa` or `testaro`.

##### Configuration

Every tool invoked by Testaro must have:

- a property in the `tests` object defined in the `run.js` file, where the property name is the ID representing the tool and the value is the name of the tool
- a `.js` file, defining the operation of the tool, in the `tests` directory, whose name base is the name of the tool

The `actSpecs.js` file (described in detail below) contains a specification for any `test` act, namely:

```javascript
test: [
  'Perform a test',
  {
    which: [true, 'string', 'isTest', 'test name'],
    launch: [false, 'object', '', 'if new browser to be launched, properties different from target, browserID, and what of the job'],
    rules: [false, 'array', 'areStrings', 'rule IDs or specifications, if not all']
    what: [false, 'string', 'hasLength', 'comment']
  }
],
```

That means that a test act (i.e. an act with a `type` property having the value `'test'`) must have a string-valued `which` property naming a tool and may optionally have an object-valued `launch` property, an array-valued `rules` property, and/or a string-valued `what` property.

If a particular test act either must have or may have any other properties, those properties are specified in the `tools` property in `actSpecs.js`.

When you include a `rules` property, you limit the tests of the tool that are performed or reported. For some tools (`alfa`, `axe`, `htmlcs`, `qualWeb`, `testaro`, and `wax`), only the specified tests are performed. Other tools (`aslint`, `ed11y`, `ibm`, `nuVal`, `nuVnu`, and `wave`) do not allow such a limitation, so, for those tools, all tests are performed but results are reported from only the specified tests.

The `nuVal`, `nuVnu`, `qualWeb`, and `testaro` tools require specific formats for the `rules` property. Those formats are described below in the sections about those tools.

##### Examples of test acts

An example of a `test` act is:

```json
{
  "type": "test",
  "which": "wave",
  "reportType": 1,
  "what": "WAVE summary"
}
```

Most tools allow you to decide which of their rules to apply. In effect, this means deciding which of their tests to run, since each test is considered a test of some rule. The act example

```javaScript
{
  type: 'test',
  which: 'alfa',
  what: 'Siteimprove alfa tool',
  rules: ['y', 'r25', 'r71']
}
```

specifies that the tests for rules `r25` and `r71` of the `alfa` tool are to be performed. If the `'y'` in the `rules` array were `'n'` instead, the act would specify that all the tests of the `alfa` tool **except** those for rules `r25` and `r71` are to be run.

One of the tools that allows rule selection, Testaro, has some rules that take additional arguments. As prescribed in `actSpecs.js`, you can pass such additional arguments to the `reporter` functions of those Testaro tests with an `args` property. Example:

```javaScript
{
  type: 'test',
  which: 'testaro',
  what: 'Testaro tool',
  rules: ['y', 'hover', 'focInd'],
  args: {
    hover: [20],
    focInd: [false, 300]
  }
}
```

This act specifies that the Testaro test `hover` is to be performed with the additional argument `20`, and `focInd` is to be performed with the additional arguments `false` and `300`.

##### Expectations

Any `test` act can contain an `expect` property. If it does, the value of that property must be an array of arrays. Each array specifies expectations about the results of the operation of the tool.

For example, a `test` act might have this `expect` property:

```javaScript
'expect': [
  ['standardResult.totals.0', '=', 0],
  ['standardResult.instances.length', '=', 0]
]
```

That would state the expectations that the `standardResult` property of the act will report no rule violations at severity level 0 and no instances of rule violations.

The first item in each array is an identifier of a property of the act. The item has the format of a string with `.` delimiters. Each `.`-delimited segment its the name of the next property in the hierarchy. If the current object is an array, the next segment must be a non-negative integer, representing the index of an element of the array.

If there is only 1 item in an array, it states the expectation that the specified property does not exist. Otherwise, there are 3 items in the array.

The second item in each array, if there are 3 items, is an operator, drawn from:

- `<`: less than
- `=`: equal to
- `>`: greater than
- `!`: unequal to
- `i`: includes
- `e`: equivalent to (parsed identically as JSON)

The third item in each array, if there are 3 items in the array, is the criterion with which the value of the first property is compared.

A typical use for an `expect` property is checking the correctness of a Testaro test. Thus, the validation jobs in the `validation/tests/jobs` directory all contain `test` acts with `expect` properties. See the “Validation” section below.

### Tool details

The tools whose tests Testaro performs have particularities described below.

#### ASLint

The `aslint` tool makes use of the [`aslint-testaro` fork](https://www.npmjs.com/package/aslint-testaro) of the [`aslint` repository](https://github.com/essentialaccessibility/aslint), which, unlike the published `aslint` package, contains the `aslint.bundle.js` file.

#### HTML CodeSniffer

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

#### Accessibility Checker

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

#### Nu Html Checker

The `nuVal` and `nuVnu` tools perform the tests of the Nu Html Checker.

Its `rules` argument is **not** an array of rule IDs, but instead is an array of rule _specifications_. A rule specification for `nuVal` or `nuVnu` is a string with the format `=ruleID` or `~ruleID`. The `=` prefix indicates that the rule ID is invariable. The `~` prefix indicates that the rule ID is variable, in which case the `ruleID` part of the specification is a matching regular expression, rather than the exact text of a message. This `rules` format arises from the fact that `nuVal` and `nuVnu` generate customized messages and do not accompany them with rule identifiers.

#### QualWeb

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

#### Testaro

The rules that Testaro can test for are implemented in files within the `testaro` directory.

The Testaro rules are classified by an `allRules` array defined in the `tests/testaro.js` file. Each item in that array is an object with these properties:

- `id`: the rule ID.
- `what`: a description of the rule.
- `launchRole`: what a test for the rule does with respect to a browser launch:
  - `sharer`: requires a browser and leaves it unchanged so the next test can safely reuse it
  - `waster`: requires a browser and modifies it so the next test cannot safely reuse it
  - `owner`: launches a custom browser itself and closes it at the end of the test
- `defaultOn`: whether the rule is to be tested for by default.
- `timeOut`: the maximum time in seconds allowed for a test for the rule.

If you do not specify rules when using the `testaro` tool, Testaro will test for its default rules. It will test for these rules in the order in which they appear in the array.

The optional `rules` argument for a `testaro` test act is an array whose first item is either `'y'` or `'n'` and whose remaining items are rule IDs. If `'y'`, then only the specified rules’ tests are performed. If `'n'`, then all the default rules are tested for, **except** for the specified rules.

The `testaro` tool (like the `ibm` tool) has a `withItems` property. If you set it to `false`, the `standardResult` object will contain an `instances` property with summaries that identify issues and instance counts. If you set it to `true`, some of the instances will be itemized.

Unlike any other tool, the `testaro` tool requires a `stopOnFail` property, which specifies whether a failure to conform to any rule (i.e. any value of `totals` other than `[0, 0, 0, 0]`) should terminate the execution of tests for the remaining rules.

You can add custom rules to the rules of any tool. Testaro provides a template, `data/template.js`, for the definition of a rule to be added. Once you have created a copy of the template with revisions, you can move the copy into the `testaro` directory and add an entry for your custom rule to the `allRules` object in the `tests/testaro.js` file. Then your custom rule will act as a Testaro rule. Some `testaro` rules are simple enough to be fully specified in JSON files. You can use any of those as a template if you want to create a sufficiently simple custom rule, namely a rule whose prohibited elements are all and only the elements matching a CSS selector. More details about rule creation are in the `CONTRIBUTING.md` file.

A new pattern for rule definition was introduced in version 60.7.0 and is implemented for only some of the applicable Testaro rules. In this pattern, the `launch` function in the `run` module adds a script to the page that runs whenever a new page is added to a browser context. That script adds `window` methods to the page. When the browser is launched for a Testaro test, the added `window` methods include a `getXPath` method and a `getInstance` method. These methods are used in rule definitions. For examples of this pattern, see the `adbID` and `lineHeight` rules.

#### WallyAX

If a `wax` test act is included in the job, an environment variable named `WAX_KEY` must exist, with your WallyAX API key as its value. You can obtain it from [WallyAX](https://account.wallyax.com/?ref_app=Developer&app_type=npm).

The `wax` tool imposes a limit on the size of a page to be tested. If the page exceeds the limit, Testaro treats the page as preventing `wax` from performing its tests. The limit is less than 500,000 characters.

#### WAVE

If a `wave` test act is included in the job, the WAVE tests will be performed either by the subscription API or by the stand-alone API.

If you want the subscription API to perform the tests, you must get a WAVE API key from [WebAIM](https://wave.webaim.org/api/) and assign it as the value of an environment variable named `WAVE_KEY`. The subscription API does not accept a transmitted document for testing. WAVE must be given only a URL, which it then visits to perform its tests. Therefore, you cannot manipulate a page and then have WAVE test it, or ask WAVE to test a page that cannot be reached directly with a URL.

If you want the stand-alone API to perform the tests, you need to have that API installed and running, and the `wave` test act needs to define the URL of your stand-alone API. The test act can also define a `prescript` script and/or a `postscript` script.

### Browser types

When you want to run some tests of a tool with one browser type and other tests of the same tool with another browser type, you can do so by splitting the rules into two test acts. For example, one test act can specify the rules as

```javascript
['y', 'r15', 'r54']
```

and the other test act can specify the rules as

```javascript
['n', 'r15', 'r54']
```

Together, they get all tests of the tool performed. Before each test act, you can ensure that the latest `launch` act has specified the browser type to be used in that test act.

### `actSpecs` file

#### Introduction to the `actSpecs` file

The `actSpecs.js` file contains rules governing acts. The rules determine whether an act is valid.

#### Rule format

The rules in `actSpecs.js` are organized into two objects, `etc` and `tests`. The `etc` object contains rules for acts of all types. The `tools` object contains additional rules that apply to some acts of type `test`, depending on the values of their `which` properties, namely which tools they perform tests of.

Here is an example of an act:

```json
{
  "type": "link",
  "which": "warming",
  "what": "article on climate change"
}
```

And here is the applicable property of the `etc` object in `actSpecs.js`:

```js
link: [
  'Click a link',
  {
    which: [true, 'string', 'hasLength', 'substring of the link text'],
    what: [false, 'string', 'hasLength', 'comment']
  }
]
```

The rule is an array with two elements: a string ('Click a link') describing the act and an object containing requirements for any act of type `link`.

The requirement `which: [true, 'string', 'hasLength', 'substring of the link text']` specifies what is required for the `which` property of a `link`-type act. The requirement is an array.

In most cases, the array has length 4:

- Item 0. Is the property (here `which`) required (`true` or `false`)? The value `true` here means that every `link`-type act **must** contain a `which` property.
- Item 1. What format must the property value have (`'string'`, `'array'`, `'boolean'`, `'number'`, or `'object'`)?
- Item 2. What other validity criterion applies (if any)? (Empty string if none.) The `hasLength` criterion means that the string must be at least 1 character long.
- Item 3. Description of the property. In this example, the description says that the value of `which` must be a substring of the text content of the link that is to be clicked. Thus, a `link` act tells Testaro to find the first link whose text content has this substring and click it.

The validity criterion named in item 2 may be any of these:

- `'hasLength'`: is not a blank string
- `'isURL`': is a string starting with `http`, `https`, or `file`, then `://`, then ending with 1 or more non-whitespace characters
- `'isBrowserType'`: is `'chromium'`, `'firefox'`, or `'webkit'`
- `'isFocusable'`: is `'a'`, `'button'`, `'input'`, `'select'`, or `'option'`
- `'isState'`: is `'loaded'` or `'idle'`
- `'isTest'`: is the name of a tool
- `'isWaitable'`: is `'url'`, `'title'`, or `'body'`
- `'areStrings'`: is an array of strings


## Invocation

Testaro features can be invoked by modules of your application when Testaro is a dependency, or directly by users who have installed Testaro as an application.

Before a module can execute a Testaro function, it must import that function from the Testaro module that exports it. A module can import function `f` from module `m` with the statement

```javascript
const {f} = require('testaro/m');`
```

## Immediate job execution

A job can be immediately executed as follows:

### By a module

```javascript
const {doJob} = require('testaro/run');
doJob(job)
.then(report => …);
```

Testaro will run the job and return a `report` object, a copy of the job with the `acts` and `jobData` properties containing the results. The final statement can further process the `report` object as desired in the `then` callback.

The Testilo package contains functions that can create jobs from scripts, add scores and explanations to reports, and create HTML documents summarizing reports.

### By a user

```bash
node call run
node call run 250525T
```

In the second example, `250525T` is the initial characters of the ID of a job saved as a JSON file in the `todo` subdirectory of the `JOBDIR` directory (`JOBDIR` refers to the value of the environment variable `JOBDIR`, obtained via `process.env.JOBDIR`).

The `call` module will find the first job file with a matching name if an argument is given, or the first job file if not. Then the module will execute the `doJob` function of the `run` module on the job, save the report in the `raw` subdirectory of the `REPORTDIR` directory, and archive the job file in the `done` subdirectory of the `JOBDIR` directory. (The report destination is named `raw` because the report has not yet been further processed by your application, perhaps using Testilo, to convert the report data into user-friendly reports.)

## Job watching

In watch mode, Testaro periodically checks for a job to run and, when a job is obtained, performs it.

### Directory watching

Testaro can watch for a job in a directory of the filesystem where Testaro or your application is located, with the `dirWatch` function.

#### Directory watching by a module

```javaScript
const {dirWatch} = require('testaro/dirWatch');
dirWatch(true, 300);
```

In this example, a moduleof your application asks Testaro to check a directory for a job every 300 seconds, to perform the jobs in the directory if any are found, and then to continue checking. If the first argument is `false`, Testaro will stop checking after performing 1 job. If it is `true`, Testaro continues checking until the `dirWatch` process is stopped.

Testaro checks for jobs in the `todo` subdirectory of `JOBDIR`. When it has performed a job, Testaro moves it into the `done` subdirectory.

Testaro creates a report for each job and saves the report in the `raw` subdirectory of `REPORTDIR`.

#### Directory watching by a user

```javaScript
node call dirWatch true 300
```

The arguments and behaviors described above for execution by a module apply here, too. If the first argument is `true`, you can terminate the process by entering `CTRL-c`.

### Network watching

Testaro can poll servers for jobs to be performed. Such a server can act as the “controller” described in [How to run a thousand accessibility tests](https://medium.com/cvs-health-tech-blog/how-to-run-a-thousand-accessibility-tests-63692ad120c3). The server is responsible for preparing Testaro jobs, assigning them to Testaro agents, receiving reports back from those agents, and performing any further processing of the reports, including enhancement, storage, and disclosure to audiences. It can be any server reachable with a URL. That includes a server running on the same host as Testaro, with a URL such as `localhost:3000`.

Network watching is governed by environment variables of the form `NETWATCH_URL_0_JOB`, `NETWATCH_URL_0_OBSERVE`, `NETWATCH_URL_0_REPORT`, and `NETWATCH_URL_0_AUTH`, and by an environment variable `NETWATCH_URLS`.

You can create as many quadruples of `…JOB`, `OBSERVE`, `…REPORT`, and `AUTH` variables as you want, one quadruple for each server that the agent may get jobs from. Each quadruple has a different number inside the variable name. The `…JOB` variable is the URL that the agent needs to send a job request to (a typical URL could be `https://testcontroller.xyz.com/api/getJob/agent3`). The `…OBSERVE` variable is the URL that the agent needs to send granular job progress messages to if the job requests that. The `…REPORT` variable is the URL that the agent needs to send a completed report to (such as `localhost:3000/api/submitReport/agent3`). The `…AUTH` variable is the password of the agent that will be recognized by the server. Each URL can contain segments and/or query parameters that identify the purpose of the request, the identity and authorization of the agent, etc.

In each quadruple, the `…AUTH` variable is optional. If it is truthy (i.e. it exists and has a non-empty value), then the job request sent to the server will be a `POST` request and the payload will be an object with an `agentPW` property, whose value is the password. Otherwise, i.e. if the variable has an empty string as its value or does not exist, the request will be a `GET` request, and an agent password, if required by the server, will need to be provided in the URL.

The `NETWATCH_URLS` variable has a value of the form `0,3,4`. This is a comma-delimited list of the numbers of the servers to be polled.

Once Testaro obtains a network job from one of the servers, Testaro performs it and adds the result data to the job, which then becomes a report. Testaro also makes its `AGENT` value the value of the `sources.agent` property of the report. Testaro then sends the report in a `POST` request to the `…REPORT` URL with the same server number. If there is a truthy `…AUTH` variable for the server, the request payload has this format:

```json
{
  "agentPW": "abcdef",
  "report": {
    …
  }
}
```

If there is no truthy `…AUTH` variable for the server, the request payload is simply the report in JSON format.

Thus, the `…AUTH` variables allow Testaro to comply with servers that object to agent passwords being visible in job request URLs and report-submission URLs and in any log messages that reproduce such URLs.

If granular reporting is desired, Testaro sends progress messages to the observation URL.

Network watching can be repeated or 1-job. 1-job watching stops after 1 job has been performed.

After checking all the URLs in succession without getting a job from any of them, Testaro waits for the prescribed time before continuing to check.

#### Network watching by a module

```javaScript
const {netWatch} = require('testaro/netWatch');
netWatch(true, 300, true);
```

In this example, a module of your application asks Testaro to check the servers for a job every 300 seconds, to perform any jobs obtained from any of the servers, and then to continue checking until the process is stopped. If the first argument is `false`, Testaro will stop checking after performing 1 job.

The third argument specifies whether Testaro should be certificate-tolerant. A `true` value makes Testaro accept SSL certificates that fail verification against a list of certificate authorities. This allows testing of `https` targets that, for example, use self-signed certificates. If the third argument is omitted, the default for that argument is implemented. The default is `true`.

#### Network watching by a user

```javaScript
node call netWatch true 300 true
```

The arguments and behaviors described above for execution by a module apply here, too. If the first argument is `true`, you can terminate the process by entering `CTRL-c`.

## Validation

### Validators

Testaro and the tests of the Testaro tool can be validated with the _executors_ located in the `validation/executors` directory.

The executor for a single test is `test`. To execute it for any test `xyz`, call it with the statement `npm test xyz`.

The other executors are:

- `run`: validates immediate test execution
- `watchDir`: validates directory watching
- `watchNet`: validates network watching
- `tests`: validates all the Testaro tests

To execute any executor `xyz` among these, call it with the statement `npm run xyz`.

The `tests` executor makes use of the jobs in the `validation/tests/jobs` directory, and they, in turn, run tests on HTML files in the `validation/tests/targets` directory.

## Contribution

You can define additional Testaro acts and functionality. Contributions are welcome.

Please report any issues, including feature requests, at the [repository](https://github.com/cvs-health/testaro/issues).

## Accessibility principles

The rationales motivating the Testaro-defined tests can be found in comments within the files of those tests, in the `tests` directory. Unavoidably, each test is opinionated. Testaro itself, however, can accommodate other tests representing different opinions. Testaro is intended to be neutral with respect to questions such as the criteria for accessibility, the severities of accessibility defects, whether accessibility is binary or graded, and the distinction between usability and accessibility.

## Challenges

### Abnormal termination

On some occasions a test throws an error that cannot be handled with a `try`-`catch` structure. It has been observed, for example, that the `ibm` test does this when the page content, rather than the page URL, is given to `getCompliance()` and the target is `https://globalsolutions.org`, `https://monsido.com`, or `https://www.ambetterhealth.com/`.

Some tools take apparently infinite time to perform their tests on some pages. One website whose pages prevent 5 of the tools from ever completing their tests is the site of BrowserStack.

To handle such fatal errors andstalling, Testaro runs the tests of each tool in a separate forked child process that executes the `doTestAct.js` module. The parent process subjects each tool to a time limit and kills the child if the time limit expires.

### Activation

Testing to determine what happens when a control or link is activated is straightforward, except in the context of a comprehensive set of tests of a single page. There, activating a control or link can change the page or navigate away from it, interfering with the remaining planned tests of the page.

The Playwright “Receives Events” actionability check does **not** check whether an event is dispatched on an element. It checks only whether a click on the location of the element makes the element the target of that click, rather than some other element occupying the same location.

### Test prevention

Test targets employ mechanisms to prevent scraping, multiple requests within a short time, automated form submission, and other automated actions. These mechanisms may interfere with testing. When a test act is prevented by a target, Testaro reports this prevention.

Some targets prohibit the execution of alien scripts unless the client can demonstrate that it is the requester of the page. Failure to provide that evidence results in the script being blocked and an error message being logged, saying “Refused to execute a script because its hash, its nonce, or unsafe-inline does not appear in the script-src directive of the Content Security Policy”. This mechanism affects tools that insert scripts into a target in order to test it. Those tools include `axe`, `aslint`, `ed11y`, and `htmlcs`. To comply with this requirement, Testaro obtains a _nonce_ from the response that serves the target. Then the file that runs the tool adds that nonce to the script as the value of a `nonce` attribute when it inserts its script into the target.

### Tool duplicativity

Tools sometimes do redundant testing, in that two or more tools test for the same defects, although such duplications are not necessarily perfect. This fact creates problems:

- One cannot be confident in excluding some tests of some tools on the assumption that they perfectly duplicate tests of other tools.
- The Testaro report from a job documents each tool’s results separately, so a single defect may be documented in multiple locations within the report, making the direct consumption of the report inefficient.
- An effort to aggregate the results into a single score may distort the scores by inflating the weights of defects that happen to be discovered by multiple tools.
- It is difficult to identify duplicate instances, in part because, as described above, tools use four different methods for identifying the locations of elements that violate tool rules.

To deal with the above problems, you can:

- configure `test` acts for tools to exclude tests that you consider duplicative
- create derivative reports that organize results by defect types rather than by tool
- take duplication into account when defining scoring rules

Some measures of these kinds are included in the scoring and reporting features of the Testilo package.

### Tool malfunctions

Tools can become faulty. For example, Alfa stopped reporting any rule violations in mid-April 2024 and resumed doing so at the end of April. In some cases, such as this, the tool maker corrects the fault. In others, the tool changes and forces Testaro to change its handling of the tool.

Testaro would become more reliable if the behavior of its tools were monitored for suspect changes.

### Dependency deployment

The behavior of Testaro as a dependency of an application deployed on a virtual private server has been observed to be vulnerable to slower performance and more frequent test failures than when Testaro is deployed as a stand-alone application on a workstation. The configuration of Testaro has been tuned for mitigation of such behaviors.

### Containerized deployment

The experimental deployment of Testaro as a dependency in a containerized application has been unsuccessful. Playwright errors have been thrown that are not thrown when the same application is deployed without containerization.

### Headless browser fidelity

Testaro normally performs tests with headless browsers. Some experiments appear to have shown that some test results are inaccurate with headless browsers, but this has not been replicated. The `launch` function in the `run` module accepts a `headEmulation` argument with `'high'` and `'low'` values. Its purpose is to permit optimizations of headless browsers to be turned off (`high`), at some performance cost, when making the browsers behave and appear more similar to headed browsers improves test accuracy. Observation has, however, failed to show any performance cost. Therefore, `'high'` is currently the default value.

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

### Automated accessibility testing at Slack

[Automated accessibility testing at Slack](https://slack.engineering/automated-accessibility-testing-at-slack/) is based on Playwright, with Axe as a single tool.

## Code style

The JavaScript code in this project generally conforms to the ESLint configuration file `.eslintrc.json`. However, the `htmlcs/HTMLCS.js` file implements an older version of JavaScript. Its style is regulated by the `htmlcs/.eslintrc.json` file.

## History

Work on the custom tests in this package began in 2017, and work on the multi-package ensemble that Testaro implements began in early 2018. These two aspects were combined into an “Autotest” package in early 2021 and into the more single-purpose packages, Testaro and Testilo, in January 2022.

On 12 February 2024 ownership of the Testaro repository was transfered from the personal account of contributor Jonathan Pool to the organization account `cvs-health` of CVS Health. The MIT license of the [repository](https://github.com/cvs-health/testaro) did not change, but the copyright holder changed to CVS Health.

Maintenance of the repository owned by CVS Health came to an end on 30 September 2025. The current repository was forked from the `cvs-health` repository in October 2025 and then unlinked from the fork network.

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
