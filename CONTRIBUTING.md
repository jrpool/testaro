# Contributing to Testaro

## Types of contributions

Testaro can benefit from contributions of various types, such as:

- Adding other tools to the tools that it integrates.
- Improving its execution speed.
- Improving the rule implementations of the `testaro` tool.
- Implementing new rules.

## Adding tools

Tools that may merit consideration include:

- Arc (by TPGi). Costs $0.05 per page tested, and requires each user to have an account with the tool maker and to allow the tool maker to charge a charge account for payment.

## Improving execution speed

Major improvements in execution speed were made in 2025 with efficiency improvements in the `testaro` tool, which previously consumed more time than any other tool. The `testaro` tests were refactored to perform their computations within the browser environment. This increased execution speed by about 2 orders of magnitude, permitting the elimination of element sampling.

Further improvements in execution speed are hypothesized to require parallelization, so that multiple tools perform their tests simultaneously.

## Improving rule implementations

Testaro relies mainly on the integrated tools for rule implementation. The rules of the `testaro` tool are intended to fill gaps not covered by the integrated tools. The tests for those rules are typically more crude than the tests of the integrated tools, so improvements in implementation quality are possible.

## Implementing new rules

Testaro has about 50 of its own rules, in addition to the approximately 950 rules of the other tools that it integrates. According to the issue classifications in the [Testilo](https://www.npmjs.com/package/testilo) package, these 1000 or so rules can be classified into about 300 accessibility _issues_, because some rules of some tools at least approximately duplicate some rules of other tools.

However, many other significant accessibility issues exist that are not covered by any of the existing rules. Thus, Testaro welcomes contributions of new rules for such issues.

### Step 1

The first step in contributing a new rule to Testaro is to satisfy yourself that it will not duplicate existing rules. The `procs/score/tic.js` file in the Testilo package should be helpful here.

### Step 2

The second step is to write a validator for the new rule. A validator is software that defines the correct behavior of the implementation of the rule.

Every Testaro rule (which means each of the approximately 50 rules of the Testaro tool) has a correspoding validator. A validator has two parts:

- A job file, in the `validation/tests/jobs` directory. It tells Testaro what tests to perform and what the results should be.
- A target directory, within the `validation/tests/targets` directory. The target directory contains one or more HTML files that will be tested by the job.

Inspecting some of the jobs and targets in the `validation/tests` directory can help you understand how validators work.

### Step 3

The third step is to add an entry to the `allRules` object in the `tests/testaro.js` file.

### Step 4

The fourth step is to implement the new rule by creating a JavaScript file and saving it in the `testaro` directory.

To optimize quality, it may be wise for one person to perform steps 1, 2, and 3, and then for a second person independently to perform step 4 (“clean-room” development).

At any time after an implementation is attempted or revised, the developer can run the validation on it, simply by executing the statement `npm test xyz` (replacing `xyz` with the name of the new rule). When the implementation fails validation, diagnosis may find fault either with the implementation or with the validator.

Whether a new rule should be implemented with support from the `doTest` function or the `getBasicResult` function depends on the requirements of the rule. If operations on each element suffice to determine whether and how that element violates the rule, the `doTest` function is appropriate. If, however, the verdict on an element requires features offered by Playwright or other dependencies that cannot be replicated easily in the browser environment, or if the verdict on one element depends on the state or properties of other elements, then the `getBasicResult` function is appropriate.

The existing `testaro` tests can serve as templates for new ones. At present, only the `hover` and `role` tests make use of the `getBasicResult` function.

## License agreement

From 12 February 2024 through 30 September 2025, contributors of code to Testaro executed the [CVS Health OSS Project Contributor License Agreement](https://forms.office.com/pages/responsepage.aspx?id=uGG7-v46dU65NKR_eCuM1xbiih2MIwxBuRvO0D_wqVFUQ1k0OE5SVVJWWkY4MTVJMkY3Sk9GM1FHRC4u) for Testaro before any pull request was approved and merged.

## License

© 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
© 2025 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT
