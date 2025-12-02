# Contributing to Testaro

## Types of contributions

Testaro can benefit from contributions of various types, such as:

- Adding other tools to the tools that it integrates.
- Improving its execution speed.
- Improving its own rule implementations.
- Implementing new rules.

## Adding tools

Tools that may merit consideration include:

- Arc (by TPGi). Costs $0.05 per page tested, and requires each user to have an account with the tool maker and to allow the tool maker to charge a charge account for payment.

## Improving execution speed

To come.

## Improving rule implementations

To come.

## Implementing new rules

Testaro has about 50 of its own rules, in addition to the approximately 900 rules of the other tools that it integrates. According to the issue classifications in the [Testilo](https://www.npmjs.com/package/testilo) package, these 950 or so rules can be classified into about 290 accessibility _issues_, because some rules of some tools at least approximately duplicate some rules of other tools.

However, many other significant accessibility issues exist that are not covered by any of the existing rules. Thus, Testaro welcomes contributions of new rules for such issues.

### Step 1

The first step in contributing a new rule to Testaro is to satisfy yourself that it will not duplicate existing rules. The latest `procs/score/tic….js` file in the Testilo package should be helpful here.

### Step 2

The second step is to write a validator for the new rule. A validator is software that defines the correct behavior of the implementation of the rule.

Every Testaro rule (which means each of the approximately 50 rules of the Testaro tool) has a correspoding validator. A validator has two parts:

- A job file, in the `validation/tests/jobs` directory. It tells Testaro what tests to perform and what the results should be.
- A target directory, within the `validation/tests/targets` directory. The target directory contains one or more HTML files that will be tested by the job.

Inspecting some of the jobs and targets in the `validation/tests` directory can help you understand how validators work.

### Step 3

The third step is to add an entry to the `evalRules` or `etcRules` object in the `tests/testaro.js` file.

### Step 4

The fourth step is to implement the new rule by creating a JavaScript or JSON file and saving it in the `testaro` directory.

To optimize quality, it may be wise for one person to perform steps 1, 2, and 3, and then for a second person independently to perform step 4 (“clean-room” development).

At any time after an implementation is attempted or revised, the developer can run the validation on it, simply by executing the statement `npm test xyz` (replacing `xyz` with the name of the new rule). When the implementation fails validation, diagnosis may find fault either with the implementation or with the validator.

Whether a new rule should be implemented in JSON or JavaScript depends on the complexity of the rule. The JSON format is effective for simple rules, and JavaScript is needed for more complex rules.

### Simple rules

You can create a JSON-defined rule if a single CSS selector can identify all and only the elements on a page that violate the rule.

Suppose, for example, that you want a rule prohibiting `i` elements (because `i` represents confusingly many different semantic properties). A single CSS selector, namely `"i"`, will identify all the `i` elements on the page, so this rule can be defined with JSON.

Substantially more complex rules, too, can satisfy this criterion. An example is the `titledEl` rule, which prohibits an element from having a `title` attribute unless the element type is `input`, `button`, `textarea`, `select`, or `iframe`. Its CSS selector is `"[title]:not(input, button, textarea, select, iframe)"`. The CSS selector in a JSON-defined rule may include [custom Playwright pseudo-classes](https://playwright.dev/docs/other-locators#css-locator).

You can copy and revise any of the existing JSON files in the `testaro` directory to implement a new rule. If, for example, you start with a copy of the `titledEl` file, you can change its properties to fit your new rule. In particular:

```json
{
  "ruleID": "titledEl",
  "selector": "[title]:not(input, button, textarea, select, iframe):visible",
  "complaints": {
    "instance": "Ineligible element has a title attribute",
    "summary": "Ineligible elements have title attributes"
  },
  "ordinalSeverity": 2,
  "summaryTagName": ""
}
```

- Assign a violation description for a single instance to `complaints.instance`.
- Assign a violation description for a summary instance (when itemization has been turned off) to `complaints.summary`.
- Assign an integer from 0 through 3 to `ordinalSeverity`.
- If all instances of violations of the rule necessarily involve elements of the same type, assign its tag name (such as `"BUTTON"`) to `summaryTagName`.

### Simplifiable rules

More complex Testaro rules are implemented in JavaScript. Some rules are _simplifiable_. These can be implemented with JavaScript modules like the one for the `allSlanted` rule. To implement such a rule, you can copy an existing module and replace the values of the 6 properties of the`ruleData` object. The significant decisions here are about the values of the `selector` and `pruner` properties.

The `selector` value is a CSS selector that identifies candidate elements for violation reporting. What makes this rule simplifiable, instead of simple, is that these elements may or may not be determined to violate the rule. Each of the elements identified by the selector must be further analyzed by the pruner. The pruner takes a Playwright locator as its argument and returns `true` if it finds that the element located by the locator violates the rule, or `false` if not.

### Complex rules

Even more complex Testaro rules require analysis that cannot fit into the simple or simplifiable category. You can begin with existing JavaScript rules, or the `data/template.js` file, as an example.

Some utility functions in modules in the `procs` directory are available for support of new rules. Among these modules are `testaro` (used in many tests), `isInlineLink`, `operable`, and `visChange`.

## License agreement

From 12 February 2024 through 30 September 2025, contributors of code to Testaro executed the [CVS Health OSS Project Contributor License Agreement](https://forms.office.com/pages/responsepage.aspx?id=uGG7-v46dU65NKR_eCuM1xbiih2MIwxBuRvO0D_wqVFUQ1k0OE5SVVJWWkY4MTVJMkY3Sk9GM1FHRC4u) for Testaro before any pull request was approved and merged.

/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
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
