/*
  Licensed under the MIT License. See LICENSE file for details.
*/

# Testaro Agent Guidelines

## Commands
- **Run all tests**: `npm run tests`
- **Run single test**: `npm test <testname>` (e.g., `npm test hover`)
- **Run job**: `npm run run [jobID]`
- **Directory watch**: `npm run dirWatch`
- **Network watch**: `npm run netWatch`
- **Lint**: `npx eslint <file>` (follows `.eslintrc.json`)

## Architecture
- **Main dirs**: `/tests` (tool test definitions), `/procs` (shared procedures), `/validation` (test validators), root (core modules)
- **Key files**: `run.js` (main executor), `actSpecs.js` (act specifications), `call.js` (CLI entry), `tests/testaro.js` (Testaro tool rules)
- **Tools**: Integrates 11 a11y tools (Axe, Alfa, IBM Checker, QualWeb, ASLint, WAVE, WallyAX, Ed11y, HTML CodeSniffer, Nu Validator, Testaro)
- **Data flow**: Jobs (JSON) → run.js → tool tests → reports (with standardized results)
- **Env vars**: Required for WallyAX (`WAX_KEY`), WAVE (`WAVE_KEY`); optional `DEBUG`, `WAITS`, `JOBDIR`, `REPORTDIR`, `AGENT`

## Code Style
- **ESLint**: 2-space indent, single quotes, semicolons required, Stroustrup brace style, no use-before-define
- **Imports**: CommonJS (`require`/`module.exports`), not ES modules
- **Naming**: camelCase for vars/functions, descriptive names, rule IDs in lowercase
- **Error handling**: Try-catch blocks, report failures via `prevented: true` in results
- **Comments**: Explain complex logic, but keep concise
