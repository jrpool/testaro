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

© 2021–2025 CVS Health and/or one of its affiliates. All rights reserved.
© 2025 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT
