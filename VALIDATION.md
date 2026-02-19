# Validation

## Introduction

Testing the correctness of Testaro is named “validation” rather than “testing”, for confusion avoidance.

The original strategy for validation is to permit any test act to contain an `expect` property, whose value specifies a fact about the result. The specification language is a custom Testaro-specific language. When an act in a job has an `expect` property, then the act in the corresponding report contains an `expectations` property that describes the success or failure of the result to conform to the specification.

In practice, no use of the `expect`/`expectations` pattern is known except for test acts whose tool is `testaro`. The other tools are treated as black boxes with no contracts entitling Testaro to hold the tools accountable for compliance. Thus, the pattern has been used for the validation of the tests of the `testaro` tool.

It may be appropriate to replace the pattern with a conventional testing approach that is widely practiced and understood, based on a platform such as Vitest and/or Playwright. While such a replacement is being considered, the documentation on the pattern that has been part of the `README.md` file is moved into this document. Here it is named “classic validation”.

## Classic validation

### Expectations

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

### Validation in Windows PowerShell

1. Install project dependencies

    ```powershell
    npm install
    ```

1. Install Playwright browsers (required)

    ```powershell
    npx playwright install
    ```

1. Run a validation for a specific rule (example: `altScheme`)

```powershell
npm test altScheme
```

Notes:

- If a validator job is stored under `validation/tests/jobProperties/pending`, copy it to `validation/tests/jobProperties/` or run the validator via the provided filenames. `altScheme` was copied already.
- If a test fails its expectations, read the JSON output printed by the validation harness for `standardResult` and `expectations` to identify missing instances.
- After making changes to rule implementations in `testaro/`, re-run the specific `npm test <ruleID>` until the validator reports success.

Preparing a PR:

- Create a branch (example `feature/add-training-rules`), commit your changes, push to remote, and open a PR describing which rules are training vs clean-room.

## License

© 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
© 2025 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT
