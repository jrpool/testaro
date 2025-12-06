# Validation README

Quick notes to run the Testaro validation tests locally (Windows PowerShell):

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
