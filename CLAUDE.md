# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install / update all dependencies and Playwright browsers
npm run deps

# Build the bundled accessible-name computation script
npm run build

# Lint (ESLint)
npx eslint .

# Validate a single Testaro rule (replace <ruleID> with the rule name, e.g. allSlanted)
npm test <ruleID>

# Validate all Testaro rules
npm run tests

# Run a job from JOBDIR/todo (optionally prefix-match by timestamp)
node call run [jobIDStart]

# Watch a directory for jobs
node call dirWatch <true|false> <intervalSeconds>

# Poll a network server for jobs
node call netWatch <true|false> <intervalSeconds> [<true|false>]
```

## Architecture

Testaro is an ensemble accessibility test runner. It integrates 10 external tools plus ~50 of its own rules (the "testaro" tool) and produces standardized reports from a job document.

### Job → Report lifecycle

1. A caller provides a **job** — a plain JS/JSON object with a `target` URL, `browserID`, optional `device`, and an `acts` array.
2. `run.js` exports `doJob(job)`, which validates the job (`procs/job.js`), builds a DOM **catalog** (`procs/catalog.js`), then delegates to `procs/doActs.js`.
3. `doActs.js` iterates the acts array. For `test` acts it forks a child process running `procs/doTestAct.js` (one per tool invocation) and enforces per-tool time limits. Non-test acts (browser interactions) execute in the parent.
4. Each tool's test module lives in `tests/<toolID>.js`. It calls the tool's library and converts the native result to the **standard result** shape (`prevented`, `totals[4]`, `instances[]`).
5. `doJob` returns the job object with `jobData` and `catalog` added at the top level and `result` added inside each `test` act. The job's `standard` property controls what `result` contains: `'no'` → `nativeResult` only; `'only'` → `standardResult` only; `'also'` → both.

The 18 act types are defined and documented in `actSpecs.js` (`etc` property). The main interactive types are `button`, `checkbox`, `focus`, `link`, `press`, `presses`, `radio`, `reveal`, `search`, `select`, `text`, `url`, `wait`. The `test` type runs a tool. `launch`, `next`, `page`, `state` control flow.

### Testaro rules (`testaro/` directory)

Each file exports a `reporter(page, catalog, withItems)` async function. Rules are registered in `tests/testaro.js` in the `allRules` array, which controls default execution order, contamination flags, time limits, and `defaultOn`.

The default order in `allRules` reflects a two-phase execution strategy: non-contaminating rules (`contaminates: false`) come first and all share a single page load; contaminating rules (`contaminates: true`) follow, each tested on a freshly loaded copy of the page.

Two rules, `shoot0` and `shoot1`, are atypical: they report no violations. Instead they take screenshots at different points during a job so that the `motion` rule can compare them to detect and measure visible page change, avoiding the latency that would be required if `motion` took its own screenshots and waited between them.

Two implementation patterns exist:

- **`doTest`** (`procs/testaro.js`): for rules whose verdict on each element can be computed in-browser via `page.evaluate`. The caller passes a CSS selector and a serialized `getBadWhat(element)` function string. This is the preferred pattern (~48 of ~50 rules).
- **`getBasicResult`** (`procs/testaro.js`): for rules that need Playwright APIs or cross-element state (currently only `hover` and `role`).

### Validation

Validation is currently broken. A reconsideration of its architecture is anticipated, but in the meantime the next paragraph describes its current inoperative design.

Validation tests live in `validation/tests/jobs/` (jobs with `expect` arrays) and `validation/tests/targets/` (static HTML pages served locally as test targets). Running `npm test <ruleID>` executes `validation/executors/test.js` → `validation/validateTest.js`, which runs the job and compares `result` fields against `expect` clauses.

### Tool XPath strategy

The catalog maps XPaths to element metadata. Each tool uses a different approach to report the elements it flags:

- `alfa`, `aslint`: report their own XPaths; Testaro normalizes them.
- `ed11y`, `wave`: Testaro injects `window.getXPath` and calls it per element.
- `axe`, `htmlcs`, `ibm`, `nuVal`, `nuVnu`, `qualWeb`: Testaro stamps `data-xpath` attributes on all elements before the tool runs.
- `testaro`: each rule reports XPaths directly.

### Environment (`.env`)

Key variables:

- `HEADED_BROWSER` — show browser windows during tests
- `DEBUG` — mirror browser console to terminal
- `WAITS` — ms delay inserted between Playwright operations (useful for debugging)
- `WAVE_KEY` — API key for the WAVE subscription API
- `JOBDIR` / `REPORTDIR` — root directories for job files and report output
- `AGENT` — instance name used in network-watch mode
- `NETWATCH_URL_<N>_JOB/OBSERVE/REPORT/AUTH`, `NETWATCH_URLS` — server polling configuration
- `TIMEOUT_MULTIPLIER` — scales all per-tool time limits (default 1)

## Code style

ESLint (`eslintrc.json`): 2-space indent, single quotes, semicolons, Stroustrup brace style (`else`/`catch` on a new line after `}`), `no-use-before-define`. The `htmlcs/HTMLCS.js` file uses a separate, looser ESLint config and must not be reformatted.

Long comments are not broken into multiple lines per paragraph.

## Adding a new Testaro rule

1. Add an entry to `allRules` in `tests/testaro.js`.
2. Create `testaro/<ruleID>.js` exporting a `reporter` function using `doTest` (preferred) or `getBasicResult`.
3. Write a validation job in `validation/tests/jobs/<ruleID>.json` with an `expect` array and corresponding HTML target(s) in `validation/tests/targets/<ruleID>/`.
4. Run `npm test <ruleID>` until validation passes.

## Key files

| File | Purpose |
| ---- | ------- |
| `run.js` | `doJob()` — the main entry point |
| `call.js` | CLI wrapper for `run`, `dirWatch`, `netWatch` |
| `procs/doActs.js` | Iterates acts; forks child for each tool |
| `procs/doTestAct.js` | Child-process entry point for tool invocations |
| `procs/testaro.js` | `doTest` / `getBasicResult` helpers for Testaro rules |
| `procs/launch.js` | Browser lifecycle (launch, goTo, nonce, wait) |
| `procs/catalog.js` | Builds the element catalog from the DOM |
| `procs/job.js` | Job validation; `tools` constant |
| `actSpecs.js` | Canonical specs for all 18 act types |
| `tests/testaro.js` | `allRules` registry for the testaro tool |
| `testaro/<ruleID>.js` | One file per Testaro rule |
| `validation/validateTest.js` | Core validation harness |
