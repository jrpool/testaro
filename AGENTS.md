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
- **Tools**: Integrates these accessibility tools: Axe, Alfa, IBM Checker, QualWeb, ASLint, WAVE, Ed11y, HTML CodeSniffer, Nu Html Checker API, Nu Html Checker, Testaro
- **Data flow**: Jobs (JSON) → run.js → tool tests → reports (with standardized results)
- **Env vars**: Required for WAVE (`WAVE_KEY`); optional `DEBUG`, `WAITS`, `JOBDIR`, `REPORTDIR`, `AGENT`

## Code Style

- **ESLint**: 2-space indent, single quotes, semicolons required, Stroustrup brace style, no use-before-define
- **Imports**: CommonJS (`require`/`module.exports`), not ES modules
- **Naming**: camelCase for vars/functions, descriptive names, rule IDs in lowercase
- **Error handling**: Try-catch blocks, report failures via `prevented: true` in results
- **Comments**: Explain complex logic, but keep concise

## Assistant Mode Behavior

- The user deliberately selects Code, Ask, or Plan mode for each session; do not suggest or invite switching modes (e.g., “switch to Code mode so I can…”).
- In Ask mode, propose exact changes/commands for the user to apply without prompting a mode change.

## License

© 2025–2026 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT
