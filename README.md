# testaro

Ensemble testing for web accessibility

## Introduction

Testaro is an application for automated web accessibility testing.

The purposes of Testaro are to:

- provide programmatic access to accessibility tests defined by several tools
- facilitate the integration of the reports of the tools into a unified report

Testaro is described in two papers:

- [How to run a thousand accessibility tests](https://medium.com/cvs-health-tech-blog/how-to-run-a-thousand-accessibility-tests-63692ad120c3)
- [Testaro: Efficient Ensemble Testing for Web Accessibility](https://arxiv.org/abs/2309.10167)

The need for multi-tool integration, and its costs, are discussed in [Accessibility Metatesting: Comparing Nine Testing Tools](https://arxiv.org/abs/2304.07591).

Testaro launches and controls web browsers, performing operations, conducting tests, and recording results.

Testaro can be installed under a MacOS, Windows, Debian, or Ubuntu operating system.

Testaro accepts _jobs_, performs them, and returns _reports_.

Other software, located on the same or a different host, can make use of Testaro, performing functions such as:

- Job preparation
- Converting user specifications into jobs
- Job scheduling
- Monitoring of the health of Testaro
- Management of clusters of workstations sharing workloads
- Allocation of responsibilities among workstations
- Receiving and fulfilling user requests for jobs
- Allocating testing responsibilities to human testers
- Combining reports from workstations and human testers
- Analyzing and summarizing (e.g., computing scores on the basis of) test results
- Sending notifications
- Revising, combining, and publishing reports

One software product that performs some such functions is [Testilo](https://www.npmjs.com/package/testilo).

## Dependencies

Testaro uses:

- [Playwright](https://playwright.dev/) to launch browsers, perform user actions in them, and perform tests
- [playwright-extra](https://www.npmjs.com/package/playwright-extra) and [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth) to make a Playwright-controlled browser more indistinguishable from a human-operated browser and thus make their requests more likely to succeed
- [playwright-dompath](https://www.npmjs.com/package/playwright-dompath) to retrieve XPaths of elements
- [pixelmatch](https://www.npmjs.com/package/pixelmatch) to measure motion

Testaro performs tests of these _tools_:

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

Some of the tests of Testaro are designed to act as approximate alternatives to tests of vulnerable, restricted, or no longer available tools. In all such cases the Testaro rules are independently designed and implemented, without reference to the code of the tests that inspired them.

## Rules

Each tool accessed with Testaro defines _rules_ and tests _targets_ for compliance with its rules. Testilo has classified the rules into _issues_ and deprecated some rules as poorly implemented. If the deprecated rules are excluded, the counts are:

```text
Accessibility Checker: 93
Alfa: 64
ASLint: 129
Axe: 79
Editoria11y: 23
HTML CodeSniffer: 110
Nu Html Checker: 260
QualWeb: 115
Testaro: 57
WallyAX: 27
WAVE: 60
total: 1017
```

This tabulation may not be exact, because some of the tools are under active development.

## Code organization

The main directories containing code files are:

- package root: main code files
- `tests`: files containing the code defining particular tests
- `procs`: shared procedures
- `validation`: code and artifacts for the validation of the Testaro tool

## System requirements

The latest long-term-support version of [Node.js](https://nodejs.org/en/).

## Installation

### As an application

You can clone the [Testaro repository](https://github.com/jrpool/testaro) to install Testaro as an application:

```bash
cd path/to/what/will/be/the/parent/directory/of/testaro
git clone https://github.com/jrpool/testaro.git
cd testaro
npm install
npx playwright install
```

After that, you can update Testaro after any version change:

```bash
cd testaro
git checkout package-lock.json
git pull
npm update
npx playwright install
```

Once it is installed as an application, you can use its features with a terminal interface by executing the “By a user” statements below.

### As a dependency

You can make Testaro a dependency of another application by installing it as you would install any `npm` package, such as by executing `npm install-save testaro` or including `testaro` among the dependencies in a `package.json` file.

Once it is installed as a dependency, your application can use Testaro features by executing the “By a module” statements below.

### Prerequisites

To make the Testaro features work, you will also need to provide the environment variables described below under “Environment variables”.

All of the tests that Testaro can perform are free of cost, except those performed by the WallyAX and WAVE tools. The owners of those tools issue API keys. A free initial allowance of usage may be granted to you with a new API key. Before using Testaro to perform their tests, get your API keys for [WallyAX](mailto:technology@wallyax.com) and [WAVE](https://wave.webaim.org/api/). Then use those API keys to define environment variables, as described below under “Environment variables”.

## Jobs

A _job_ is an object that specifies what Testaro is to do. As Testaro performs a job, Testaro reports results by adding data to the job and making that enhanced object available as a _report_.

### Example of a job

Here is an example of a job:

```javaScript
{
  id: '250110T1200-7f-4',
  what: 'monthly health check',
  strict: true,
  standard: 'also',
  observe: false,
  device: {
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
  browserID: 'webkit',
  creationTimeStamp: '241229T0537',
  executionTimeStamp: '250110T1200',
  target: {
    what: 'Real Estate Management',
    url: 'https://abccorp.com/mgmt/realproperty.html'
  },
  sources: {
    script: 'ts99',
    batch: 'departments',
    mergeID: '7f',
    requester: 'malavu@abccorp.com'
  },
  acts: [
    {
      type: 'test',
      launch: {},
      which: 'axe',
      detailLevel: 2,
      rules: ['landmark-complementary-is-top-level'],
      what: 'Axe'
    },
    {
      type: 'test',
      launch: {},
      which: 'qualWeb',
      withNewContent: false,
      rules: ['QW-BP25', 'QW-BP26']
      what: 'QualWeb'
    }
  ]
}
```

This job tells Testaro to perform two _acts_. One performs one test of the Axe tool wih reporting at detail level 2, and the other performs two tests of the QualWeb tool.

Each act includes a `launch` property with a default value. That instructs Testaro, before performing those tests, to launch a new Webkit browser, open a context (window) with some properties of an iPhone 8 and without a reduced-motion setting, create a page (tab), and navigate to a particular page of the `abccorp.com` website.

Job properties:

- `id`: a string uniquely identifying the job.
- `what`: a description of the job.
- `strict`: `true` or `false`, indicating whether _substantive redirections_ should be treated as failures. These are redirections that do more than add or subtract a final slash.
- `standard`: whether standardized versions of tool reports are to accompany the original versions (`'also'`), replace the original versions (`'only'`), or not be produced (`'no'`).
- `observe`: `true` or `false`, indicating whether tool and Testaro-rule invocations are to be reported to the server as they occur, so that the server can update a waiting client.
- `device`: the ID of a device and the properties of each new browser context (window) that will be set for conformity to that device, unless overridden by an act. It must be `'default'` or the ID of one of [about 125 devices recognized by Playwright](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json).
- `browserID`: the ID of the browser to be used, unless overridden by an act. It must be `'chromium'`, `'firefox'`, or `'webkit`'.
- `creationTimeStamp`: a string in `yymmddThhMM` format, describing when the job was created.
- `executionTimeStamp`: a string in `yymmddThhMM` format, specifying a date and time before which the job is not to be performed.
- `target`: data about the target of the job, or `{}` if the job involves multiple targets.
- `sources`: data optionally inserted into the job by the job creator for use by the job creator.
- `acts`: an array of the acts to be performed (documented below).

## Acts

### Introduction to acts

Each act object has a `type` property and optionally has a `name` property (used in branching, described below). It must or may have other properties, depending on the value of `type`.

### Act types

The acts can tell Testaro to perform any of:
- _navigations_ (browser launches, visits to URLs, waits for page conditions, etc.)
- _moves_ (clicks, text inputs, hovers, etc.)
- _alterations_ (changes to the page)
- _tests_ (one or more of the tests defined by a tool)
- _branching_ (continuing from an act other than the next one)

#### Navigations

An example of a **navigation** is:

```json
{
  "type": "wait",
  "which": "travel",
  "what": "title"
}
```

In this case, Testaro waits until the page title contains the string “travel” (case-insensitively).

There is also a `launch` act. You need it in any job before other acts can be performed, unless the acts are all `test` acts and they include `launch` properties, as in the job example above. That `launch` property is a compact alternative to a `launch` act.

#### Moves

An example of a **move** is:

```json
{
  "type": "radio",
  "which": "No",
  "index": 2,
  "what": "No, I am not a smoker"
}
```

In this case, Testaro checks the third radio button whose text includes the string “No” (case-insensitively).

In identifying the target element for a move, Testaro matches the `which` property with the texts of the elements of the applicable type (such as radio buttons). It defines the text of an `input` element as the concatenated texts of its implicit label or explicit labels, if any, plus, for the first input in a `fieldset` element, the text content of the `legend` element of that `fieldset` element. For any other element, Testaro defines the text as the text content of the element.

When the texts of multiple elements of the same type will contain the same `which` value, you can include an `index` property to specify the index of the target element, among all those that will match.

#### Alterations

An example of an **alteration** is:

```json
{
  "type": "reveal",
  "what": "make everything visible"
}
```

This act causes Testaro to alter the `display` and `visibility` style properties of all elements, where necessary, so those properties do not make any element invisible.

#### Branching

An example of a **branching** act is:

```json
{
  "type": "next",
  "if": ["totals.invalid", ">", 0],
  "jump": -4,
  "what": "redo search if any invalid elements"
}
```

This act checks the result of the previous act to determine whether its `result.totals.invalid` property has a positive value. If so, it changes the next act to be performed, specifying the act 4 acts before this one.

A `next` act can use a `next` property instead of a `jump` property. The value of the `next` property is an act name. It tells Testaro to continue performing acts starting with the act having that value as the value of its `name` property.

#### Tools

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

When you include a `rules` property, you limit the tests of the tool that are performed or reported. For some tools (`alfa`, `axe`, `htmlcs`, `qualWeb`, `testaro`, and `wax`), only the specified tests are performed. Other tools (`aslint`, `ed11y`, `ibm`, `nuVal`, and `wave`) do not allow such a limitation, so, for those tools, all tests are performed but results are reported from only the specified tests.

The `nuVal`, `qualWeb`, and `testaro` tools require specific formats for the `rules` property. Those formats are described below in the sections about those tools.

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

When a `test` act has an `expect` property, the result for that act has an `expectations` property reporting whether the expectations were satisfied. The value of `expectations` is an array of objects, one object per expectation. Each object includes a `property` property identifying the expectation, and a `passed` property with `true` or `false` value reporting whether the expectation was satisfied. If applicable, it also has other properties identifying what was expected and what was actually reported.

### Tools

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

These changes were proposed as pull requests 1333 and 1334 (https://github.com/IBMa/equal-access/pulls).

The `ibm` tool is one of two tools (`testaro` is the other) with a `withItems` property. If you set `withItems` to `false`, the result includes the counts of “violations” and “recommendations”, but no information about the rules that gave rise to them.

Experimentation indicates that the `ibm` tool emits untrappable errors for some targets when the content argument given to it is the page content rather than the page URL. Therefore, it is safer to use `true` as the value of `withNewContent` for the `ibm` tool.

#### Nu Html Checker

The `nuVal` tool performs the tests of the Nu Html Checker.

Its `rules` argument is **not** an array of rule IDs, but instead is an array of rule _specifications_. A rule specification for `nuVal` is a string with the format `=ruleID` or `~ruleID`. The `=` prefix indicates that the rule ID is invariable. The `~` prefix indicates that the rule ID is variable, in which case the `ruleID` part of the specification is a matching regular expression, rather than the exact text of a message. This `rules` format arises from the fact that `nuVal` generates customized messages and does not accompany them with rule identifiers.

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

The target can be provided to QualWeb either as an existing page or as a URL. Experience indicates that the results can differ between these methods, with each method reporting some rule violations or some instances that the other method does not report. For at least some cases, more rules are reported violated when an existing page is provided (`withNewItems: false`).

#### Testaro

If you do not specify rules when using the `testaro` tool, Testaro will test for the rules listed in the `evalRules` object of the `tests/testaro.js` file.

The `rules` argument for a `testaro` test act is an array whose first item is either `'y'` or `'n'` and whose remaining items are rule IDs. If `'y'`, then only the specified rules’ tests are performed. If `'n'`, then all the evaluative tests are performed, **except** for the specified rules.

The `testaro` tool (like the `ibm` tool) has a `withItems` property. If you set it to `false`, the `standardResult` object will contain an `instances` property with summaries that identify issues and instance counts. If you set it to `true`, some of the instances will be itemized.

Unlike any other tool, the `testaro` tool requires a `stopOnFail` property, which specifies whether a failure to conform to any rule (i.e. any value of `totals` other than `[0, 0, 0, 0]`) should terminate the execution of tests for the remaining rules.

Warnings in the `testaro/hover.js`, `testaro/motion.js`, and `procs/visChange.js` files advise you to avoid launching particular browser types for the performance of particular Testaro tests.

Several Testaro tests make use of the `init()` function in the `procs/testaro` module. That function samples elements if the population of elements to be tested is larger than 100. The purpose is to achieve reasonable performance. The sampling overweights elements near the beginning of a page, because of the tendency of that location to have important and atypical elements.

You can add custom rules to the rules of any tool. Testaro provides a template, `data/template.js`, for the definition of a rule to be added. Once you have created a copy of the template with revisions, you can move the copy into the `testaro` directory and add an entry for your custom rule to the `evalRules` object in the `tests/testaro.js` file. Then your custom rule will act as a Testaro rule. Some `testaro` rules are simple enough to be fully specified in JSON files. You can use any of those as a template if you want to create a sufficiently simple custom rule, namely a rule whose prohibited elements are all and only the elements matching a CSS selector. More details about rule creation are in the `CONTRIBUTING.md` file.

#### WallyAX

If a `wax` test act is included in the job, an environment variable named `WAX_KEY` must exist, with your WallyAX API key as its value. You can request it from [WallyAX](mailto:technology@wallyax.com).

The `wax` tool imposes a limit on the size of a page to be tested. If the page exceeds the limit, Testaro treats the page as preventing `wax` from performing its tests. The limit is less than 500,000 characters.

#### WAVE

If a `wave` test act is included in the job, the WAVE tests will be performed either by the subscription API or by the stand-alone API.

If you want the subscription API to perform the tests, you must get a WAVE API key from [WebAIM](https://wave.webaim.org/api/) and assign it as the value of an environment variable named `WAVE_KEY`. The subscription API does not accept a transmitted document for testing. WAVE must be given only a URL, which it then visits to perform its tests. Therefore, you cannot manipulate a page and then have WAVE test it, or ask WAVE to test a page that cannot be reached directly with a URL.

If you want the stand-alone API to perform the tests, you need to have that API installed and running, and the `wave` test act needs to define the URL of your stand-alone API. The test act can also define a `prescript` script and/or a `postscript` script.

### Browser types

The warning comments in the `testaro/hover.js` and `testaro/motion.js` files state that those tests operate correctly only with the `webkit` browser type. The warning comment in the `testaro/focInd.js` file states that that test operates incorrectly with the `firefox` browser type.

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

## Reports

### Introduction to reports

Any Testaro job produces a report, which is a copy of the job with additional data produced by Testaro as it performed the job. Like a job, a report is an object that can be serialized to JSON for file storage.

### Job-level data

The data that Testaro adds to a job to create a report include job-level data: data describing the how the job as a whole was performed. For example, when it was completed and how long it took to run.

Properties that were in a job when it was given to Testaro remain unchanged in the report. New data produced by Testaro during its performance of a job are inserted into a new `jobData` property in the report.

### Act-level data

#### Act-level data in general

Testaro also adds act-level data to each job. Among the new act-level data are two additional properties added to each `act` object in the report: `data` and `result`.

#### Act-level data from `test` acts

The new properties added to `test` acts, in addition to `data` and `result`, include:

- `what`: the name of the tool
- `actualURL`: the URL of the visited page, after any redirections
- `startTime`: when the tool was started
- `endTime`: when the tool reported its results
- `expectations`: the results of validations specified by the act in `expect` properties
- `expectationFailures`: the count of failed validations
- `standardResult`: if requested, the `result` property converted to a Testaro-standard structure

For any `test` act, the values of the `data` and `result` properties are specific to the tool that the act invokes, but are subject to some constraints that facilitate the integration of the tool reports into a standardized uniform report.

The `data` object can have these properties:

- `success`: `true` or `false`, depending on whether a tool report was delivered
- `error`: a string characterizing the failure, if any
- `prevented`: `true` or `false`, depending on whether the page prevented the tool from performing its tests

In order to make its reports user-friendly, Testaro removes irrelevant data from the native reporting of each tool and coerces the remaining data into some uniformity. Testaro does this by using a module of its own to run each tool. Those modules are files located in the `tests` directory. Each module runs the corresponding tool, gets a tool-native report from the tool, prunes it, and coerces what remains into a _tool report_, which is subject to some format constraints.

The `data` object can have any properties that might be useful to Testaro, and the names of these properties can differ from one tool to another. The `result` object, however, is constrained.

### Contents


### Formats

#### Tool-report formats

The tools listed above as dependencies write their tool reports in various formats. They differ in how they organize multiple instances of the same problem, how they classify severity and certainty, how they point to the locations of problems, how they name problems, etc.

A Testaro report can include, for each tool, either or both of these properties:

- `result`: the result in the native tool format.
- `standardResult`: the result in a standard format identical for all tools.

#### Standard result

##### Properties

The standard result includes three properties:

- `prevented`: a boolean (`true` or `false`) value, stating whether the page prevented the tool from performing its tests.
- `totals`: an array of numbers representing how many instances of rule violations at each level of severity the tool reported. There are 4 ordinal severity levels. For example, the array `[3, 0, 14, 10]` would report that there were 3 violations at level 0, 0 at level 1, 14 at level 2, and 10 at level 3.
- `instances`: an array of objects describing the rule violations. An instance can describe a single violation, usually by one element in the page, or can summarize multiple violations of the same rule.

If the value of `prevented` is `true`, the standard result also includes an `error` property describing the reason for the failure.

##### Instances

Here is an example of a standard instance:

```javascript
{
  ruleID: 'rule01',
  what: 'Button type invalid',
  ordinalSeverity: 2,
  count: 1,
  tagName: 'BUTTON'
  id: '',
  location: {
    doc: 'dom',
    type: 'xpath',
    spec: '/html[1]/body[1]/section[3]/div[2]/div[1]/ul[1]/li[1]/button[1]'
  },
  excerpt: '<button type="link"></button>',
  boxID: '12:340:46:50',
  pathID: '/html/body/section[3]/div[2]/div/ul/li[1]/button[1]'
}
```

This instance describes a violation of a rule named `rule01` by a `button` element.

The element has no `id` attribute to distinguish it from other `button` elements, but the tool describes its location. This tool uses an XPath to do that. Tools use various methods for location description, namely:

- `line` (line number in the code of the page): Nu Html Checker
- `selector` (CSS selector): Axe, QualWeb, WAVE
- `xpath`: Alfa, ASLint, Equal Access
- `box` (coordinates, width, and height of the element box): Editoria11y, Testaro
- none: HTML CodeSniffer

The tool also reproduces an excerpt of the element code.

##### Element identification

While the above properties can help you find the offending element, Testaro makes this easier by adding, where practical, two standard element identifiers to each standard instance:

- `boxID`: a compact representation of the x, y, width, and height of the element bounding box, if the element can be identified and is visible.
- `pathID`: the XPath of the element, if the element can be identified.

These standard identifiers can help you determine whether violations reported by different tools belong to the same element or different elements. The `boxID` property can also support the making of images of the violating elements.

Some tools limit the efficacy of the current algorithm for standard identifiers:
- HTML CodeSniffer does not report element locations, and the reported code excerpts exclude all text content.
- Nu Html Checker reports line and column boundaries of element start tags and truncates element text content in reported code excerpts.

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
- The `ruleID` property of an instance is a matching rule if the tool issues a message but no rule identifier for each instance. The `nuVal` tool does this. In this case, Testaro is classifying the messages into rules.
- The `ruleID` property of an instance may reclassify tool rules. For example, if a tool rule covers multiple situations that are dissimilar, that rule may be split into multiple rules with distinct `ruleID` properties.

You are not dependent on the judgments incorporated into the standard format, because Testaro can give you the original reports from the tools.

The standard format does not express opinions on issue classification. A rule ID identifies something deemed to be an issue by a tool. Useful reporting from multi-tool testing still requires the classification of tool **rules** into **issues**. If tool `A` has `alt-incomplete` as a rule ID and tool `B` has `image_alt_stub` as a rule ID, Testaro does not decide whether those are really the same issue or different issues. That decision belongs to you. The standardization of tool reports by Testaro eliminates some of the drudgery in issue classification, but not any of the judgment required for issue classification.

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

## Environment variables

In addition to their uses described above, environment variables can be used by acts of type `test`, as documented in the `actSpecs.js` file.

Before making Testaro run a job, you can optionally also set `DEBUG` (to `'true'` or anything else) and/or `WAITS` (to a non-negative integer). The effects of these variables are described in the `run.js` file.

You may store environment variables in an untracked `.env` file if you wish, and Testaro will recognize them. Here is a template for a `.env` file:

```conf
AGENT=agentabc
DEBUG=false
JOBDIR=../testing/jobs
NETWATCH_URL_0_JOB=http://localhost:3000/api/assignJob/agentabc
NETWATCH_URL_0_OBSERVE=http://localhost:3000/api/granular/agentabc
NETWATCH_URL_0_REPORT=http://localhost:3000/api/takeReport/agentabc
NETWATCH_URL_0_AUTH=abcxyz
NETWATCH_URLS=0
PUPPETEER_DISABLE_HEADLESS_WARNING=true
REPORTDIR=../testing/reports
WAITS=0
WAVE_KEY=yourwavekey
WAX_KEY=yourwaxkey
```

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

Some tools take apparently infinite time to perform their tests on some pages. To handle such stalling, Testaro subjects all tools to time limits. The limitation is implemented with forked child processes. Specifically, the `procs/doTestAct.js` module is run as a forked process with a `timeout` option for each of the 11 tools.

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

### Containerized deployment

The experimental deployment of Testaro as a dependency in a containerized application has been unsuccessful. Playwnight errors have been thrown that are not thrown when the same application is deployed without containerization.

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
