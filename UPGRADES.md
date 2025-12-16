# UPGRADES

## License

© 2025 CVS Health and/or one of its affiliates. All rights reserved.
© 2025 Jonathan Robert Pool.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](../../LICENSE) file
at the project root for details.

SPDX-License-Identifier: MIT

## Major decisions for JavaScript to TypeScript conversion

_Exported on 9/24/2025 at 20:24:42 PDT from Cursor (1.6.45)_

---

## User

What are the major decisions that will be required if this entire repository is converted from JavaScript to TypeScript?

---

## Cursor

I'll scan key files to understand the current setup (module system, scripts, dependencies) so I can tailor the TypeScript migration decisions to this repo’s specifics.

I'll quickly scan for module patterns and JSON imports across the repo to tailor the TypeScript migration decisions (CJS vs ESM, JSON handling, dynamic requires).

### Major decisions for a full TypeScript migration

- **Module system and runtime**
  - CommonJS vs ESM output (`module` = commonjs vs nodenext) and `package.json` `"type"` choice.
  - Whether to keep `require/exports` at runtime or rewrite to `import/export` in source.
  - `esModuleInterop`/`allowSyntheticDefaultImports` settings for interop.

- **Build vs runtime execution**
  - Transpile-then-run (`tsc` to `dist/`) vs on-the-fly (`ts-node`/register) for all CLI executors in `validation/executors/` and top-level scripts.
  - If building, how to resolve runtime paths to forked workers (e.g., `procs/doTestAct`): compute `dist` paths, or use a loader.

- **Pathing for child processes**
  - How `child_process.fork` targets compiled files (adjust `__dirname` usage, emit to predictable `outDir`, or use ts-node in children).
  - Consistent strategy for file URL handling (current `file://` normalization logic) post-build.

- **Type strictness and tsconfig**
  - Level of strictness (`strict`, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
  - Target and libs (`target` ES2020/ES2022; `lib` includes `ES2020`, `DOM` if needed for `page.evaluate` contexts).
  - `moduleResolution` (`node`, `nodenext`, or `bundler`) and `resolveJsonModule` (only if you convert JSON imports from fs-read to imports).

- **Data model design**
  - Formal interfaces for `Job`, `Report`, `Act` (discriminated unions for `type` = `launch|test|url|wait|state|page|...`), and nested structures like `standardResult`, `jobData`, `toolTimes`.
  - How much to type dynamic/mutable shapes (e.g., `report.jobData.*`, adding properties lazily) vs using `any`/`Partial`.
  - Strategy for optional properties and progressive enrichment during execution.

- **3rd‑party types and augmentations**
  - Verify/choose type packages for `playwright`, `@siteimprove/alfa-*`, `axe-playwright`, `@qualweb/*`, `accessibility-checker`, `playwright-dompath`, `pixelmatch`. Plan fallbacks if defs are missing.
  - Decide on module augmentation vs casting for custom fields (e.g., `page.browserID` assignment requires augmenting `playwright.Page` or casting).

- **Dynamic loading patterns**
  - `tests/testaro.js` dynamically requires rule modules by filename; decide to:
    - keep dynamic `require` (typed as `unknown`/`any`), or
    - replace with a typed registry/factory, or
    - use dynamic `import()` with explicit result typing.
  - Same decision for runtime JSON rule loading vs typed imports.

- **JSON rule and data typing**
  - Define interfaces for JSON rule files in `testaro/*.json` and job property JSON under `validation/tests/jobProperties/`.
  - Whether to keep fs-based JSON reads (runtime-validated) or switch to typed imports using `resolveJsonModule`.

- **Node/DOM boundary typing**
  - How to type `page.evaluate` payloads and element handles; utility helpers like `textOf`, `getLocatorData`, `boxOf` should have precise generics vs `any`.
  - Decide whether to include `DOM` lib globally or rely on Playwright types and narrow evaluate functions.

- **Error and result typing**
  - Standardize error codes/messages (e.g., `'status429'`, `'badRedirection'`, numeric codes from children) into a typed union.
  - Time-limit handling and messaging types for per-rule timeouts.

- **Project layout and outputs**
  - Where compiled files live (`dist/` mirroring current tree) and which directories are included/excluded (`node_modules`, `temp/`, `validation/jobs/**`, `validation/tests/targets/**`).
  - Whether to keep `.js` under `testaro/` alongside `.json` or convert all rule JS to `.ts`.

- **Tooling**
  - ESLint to TS config (`@typescript-eslint/*`, parser, rules), what to enforce/relax during migration.
  - Incremental checking plan (`allowJs`, `checkJs`, JSDoc types) vs big‑bang conversion.
  - `skipLibCheck` policy for faster builds vs stricter dependency checks.

- **Runtime compatibility and CI**
  - Minimum Node version (current code uses `fs/promises`; align `target`/features accordingly).
  - Update `npm` scripts to run compiled executors or ts-node variants; adjust `main`/exports fields.
  - Update CI to compile, run validation suites, and publish artifacts if applicable.

- **Performance and DX choices**
  - Use of `tslib`/`importHelpers` to reduce output size.
  - Source maps for debugging vs build speed.
  - Build caching and watch mode for local dev across many small files.

- **Public API typing**
  - Surface types for externally used entry points like `run.js` (`doJob`, `launch`) if this is used as a library; decide on `.d.ts` emission and what is considered public.

- **Gradual safety boundaries**
  - Where to place `unknown`/`any` escapes (e.g., dynamic module results, process messages) and how to fence them with runtime guards to preserve correctness.

- **Behavioral parity vs refactor**
  - Whether to refactor opportunistically (e.g., replace dynamic exports, normalize act handling with discriminated unions) or preserve exact runtime semantics first and harden types later.

- **Monorepo/external types scenario (if needed)**
  - If `ibmOutput/` or other data folders need typings or should be excluded entirely from compilation.

- **Licensing and headers**
  - How to preserve license headers/comments during transpilation if that’s a requirement.

- **Migration sequencing**
  - Directory order (e.g., core `procs/` first, then `tests/`, then executors) and gate criteria to keep `validation` flows working throughout.

- **Testing strategy**
  - Decide on type-level tests and runtime regression checks for the many rules in `testaro/` to ensure no behavior drift.

- **Non-standard patterns**
  - Confirm approach for in-place mutation of Playwright elements (focus/check/click workflows) and timing helpers to remain compatible under TS’s stricter async typing.

- **Distribution and consumers**
  - If published, decide on dual CJS/ESM output and `exports` map for consumers; if internal CLI only, keep CJS for simplicity.

- **Env/config handling**
  - Typing for env vars (e.g., `DEBUG`, `WAITS`) and a strategy to centralize env parsing, optionally with a schema.

- **File I/O and paths**
  - Formalize types for file contents read/written (reports, JSON job files) and ensure atomicity/encoding assumptions are explicit.

- **Automated code mods**
  - Choose codemods for `require`→`import`, `exports.`→`export`, and add TSDoc/JSDoc scaffolding where helpful.

- **Fallback for missing types**
  - Policy for creating minimal `*.d.ts` shims vs pinning dependency versions that ship their own types.

- **Security and sandboxing**
  - Revisit `page.evaluate` usage to ensure types don’t mask unsafe patterns; possibly introduce typed helpers for CSP/nonce handling.

- **Ownership and conventions**
  - Naming, folder structure for types, and conventions (e.g., suffix `*Rule.ts` for testaro rules, `*Executor.ts` for executors).

- **Performance budgets**
  - Ensure TS doesn’t slow hot paths; decide on `transpileOnly` for dev and full type-check in CI.

- **Docs**
  - Whether to publish type-first docs for rules, job schema, and report schema.

- **Binary compatibility and scripts**
  - Shebang/CLI wrappers if any are added; adjust NPM scripts (`run`, `tests`, `dirWatch`, `netWatch`) to compiled targets.

- **Source of truth for rule registry**
  - Move from filesystem discovery/dynamic require to a typed registry or keep FS-based discovery and accept weaker typing there.

- **Augmentation of global state**
  - Approach for module-global mutable state (`browser`, `page`, `actIndex`, `actCount`) under TS (keep, or encapsulate for easier typing).

- **Error codes and enums**
  - Decide on enums/constants for error strings currently used ad hoc across modules.

- **Back-compatibility**
  - If external users rely on current JS entry points, decide on keeping JS shim files or major-version bump.

- **CI artifacts**
  - Whether to commit `dist/` for executors used by external systems (if any) or build on demand.

- **Validation data**
  - Type-checking and exclude patterns for large static trees under `validation/tests/targets/**`.

- **Standardization pipeline**
  - Strongly typing `standardize`, `identify`, `getLocatorData` interfaces to ensure the report format remains stable.

- **Global configuration**
  - Where to centralize tsconfig(s): single root vs per-folder `tsconfig.json` if executors or tests need different settings.

- **Dev ergonomics**
  - Editor/watch settings for auto-build and source maps to keep the current debugging/logging experience.

- **Release management**
  - Versioning strategy aligning the migration with a major release and a deprecation window for JS users.

- **Repository hygiene**
  - Git ignore updates for `dist/`, source maps, and generated typings; precommit checks for type errors.

- **Incremental guardrails**
  - Introduce `// TODO(ts):` backlog tags and thresholds (e.g., don’t merge if new `any`s added) to keep type quality from regressing.

- **Performance of rule timeouts**
  - Keep or parameterize the 15s per-rule timeout with typed config; ensure typings don’t accidentally widen timing types.

- **Playwright context**
  - Decide if `Page`/`BrowserContext` are passed through typed helpers rather than shared module state to improve type soundness.

- **Logging**
  - Strongly type logging interfaces and message formats (currently strings) if you want structured logs.

- **Observability hooks**
  - Type `tellServer` interface so message parameters are validated at compile time.

- **Temporary directories and file lifecycle**
  - Ensure typed guarantees for report temp file creation/deletion around `doActs`.

- **Edge-case Node APIs**
  - Keep `process.on('message')` and `fork` message contract typed (e.g., discriminated unions for IPC).

- **Risk posture**
  - Choose between maximal type safety (more refactor) vs minimal-change transpilation (faster migration, looser types).

- **Team workflow**
  - Coding standards for type annotations, error handling, and rule authoring templates (`data/template.js` → `.ts`).

- **Documentation updates**
  - Update `README.md` and contributor docs for TS build, scripts, and rule authoring in TS.

- **License headers**
  - Confirm TypeScript compiler preserves headers in output where needed.

- **Binary assets**
  - Decide on handling and typing for `ed11y/editoria11y.min.js`, `htmlcs/HTMLCS.js`, and `temp/engine/*.js` (likely exclude from TS).

- **Validation executors**
  - Whether to type and migrate `validation/**` (watchers, runners) now or later; they are part of the runtime entrypoints.

- **Scripted searches**
  - If any script relies on `.js` globbing, update to include `.ts` or compiled `.js` as appropriate.

- **Monorepo split (optional)**
  - Consider separating library (`procs/`, `testaro/`) from CLI/executors to simplify build and type boundaries.

- **Release notes and migration guide**
  - Communicate breaking changes (paths, module format, APIs) to downstream users.

- **Contingency**
  - Rollback plan if TS introduces runtime regressions; maintain a JS branch during transition.

- **Ownership of generated types**
  - Whether to emit `.d.ts` for public consumption and how to keep them in sync.

- **Security posture**
  - Type-narrow inputs to `page.evaluate` to reduce injection risks; consider runtime schema validation aligned with compile-time types.

- **Consistency and naming**
  - Normalize names (e.g., rule IDs, act types) in enums to prevent typo bugs now caught by types.

- **Testing gates**
  - Enforce typecheck in CI (noEmit + typecheck) and keep separate from build to catch type errors early.

- **Performance tuning**
  - `skipLibCheck` usage for speed in CI, and segment builds if needed.

- **Dev dependency choices**
  - Add and pin: `typescript`, `ts-node` (if used), `@types/node`, `@typescript-eslint/*`, `tslib`.

- **Scaffolding**
  - Provide a TS rule template replacing `data/template.js`.

- **Migration approach**
  - Big bang vs module-by-module with `allowJs`; define the cutover point for flipping scripts to compiled artifacts.

- **Source map policy**
  - Whether to emit for executors (useful for debugging) and how to ship them.

- **Error handling consistency**
  - Tighten thrown vs returned error patterns and type them across modules.

- **API surfaces to freeze**
  - Identify external-callable functions (e.g., `doJob`) and lock their types as public contracts.

- **Coding ergonomics**
  - Decide on utility types and helpers to avoid repeated broad `any`.

- **CI matrix**
  - If Node versions vary in your environments, decide on supported versions and align TS `target` and features.

- **Sourcemap stack traces**
  - Configure `source-map-support` if you need clean stack traces in production.

- **Rule discovery**
  - If you keep filesystem discovery of rules, define a typed manifest generator to bridge dynamic loading and static typing.

- **Binary and non-TS code**
  - Exclude third-party/minified JS from the TS pipeline; document it in `tsconfig.exclude`.

- **Globbing and watch**
  - Decide on watch-mode for dev across large tree and avoid compiling validation target fixtures.

- **Optional refactors**
  - Replace stringly-typed error/status codes with enums for compile-time checks.

- **Docs for contributors**
  - Update `CONTRIBUTING.md` to explain adding new rules/tests in TS.

- **License and headers policy**
  - Ensure headers are preserved via tsconfig `removeComments: false` (or custom tooling).

- **Long-term maintenance**
  - Plan for gradually increasing strictness and paying down `any`/casts.

- **Ownership of types**
  - Assign owners for core type packages (job/report schema) to prevent drift.

- **Release cadence**
  - Decide on a major version for TS cutover and soft-deprecate JS.

- **Verification runs**
  - Run the existing `validation` flows pre/post migration to assert parity.

- **Scripting updates**
  - Update NPM scripts to call `node dist/...` or `ts-node ...` consistently.

- **Formatting**
  - Decide on Prettier integration for TS files.

- **Path aliases**
  - Whether to introduce TS path mapping (e.g., `@procs/*`) and align runtime with `tsconfig-paths` if used.

- **Type exposure for consumers**
  - If this is used as a library, add `types` in `package.json` and consider dual-emit CJS/ESM with an `exports` map.

- **Internal logging contracts**
  - Give `tellServer` a typed param object instead of loosely concatenated query strings.

- **IPC contracts**
  - Type the message payloads between parent and forked child (act results, error codes) as discriminated unions.

- **Rule authoring ergonomics**
  - Provide typed helpers (`init`, `report`, `simplify`) signatures and ensure rule modules stay small and consistent.

- **Binary deps (Playwright)**
  - Decide if Playwright version pins need to change for type stability.

- **Local dev**
  - Editor/tsserver performance considerations; exclude large static trees to keep TS fast.

- **Guarding dynamic text operations**
  - Tight typing for text processing helpers (`debloat`, `textOf`) to reduce nullability issues.

- **Backward-compatible shims**
  - If external systems call JS entrypoints, add thin JS shims that `require` built outputs.

- **Risk acceptance**
  - Explicitly document areas that remain `any` for practicality (dynamic rule loading, external tool outputs).

- **Ownership and review**
  - Establish code owners for type changes spanning modules (`procs/`, `tests/`, `validation/`).

- **Documentation of schemas**
  - Publish the job/report JSON schema alongside TS types to keep runtime validation aligned.

- **SLA for migration**
  - Timeline and checkpoints (compile, typecheck clean, parity runs, strictness uplift).

- **Final cutover**
  - Switch scripts to compiled artifacts, remove `allowJs`, and enforce TS-only in CI.

- **Post-cutover cleanups**
  - Remove unused JS files, codemod leftovers, and deprecated helpers.

- **Observability**
  - Optional: typed structured logs to replace ad hoc `console.log` parsing in CI.

- **Security review**
  - Review `page.evaluate` and dynamic inputs under strict types; add guards where types reveal risks.

- **Team training**
  - Align on TS patterns (narrowing, discriminated unions, module augmentation).

- **Performance validation**
  - Ensure no regressions in tool time limits and process orchestration after build step insertion.

- **Long-term benefits**
  - Decide which parts gain the most from rich typing first (job/act schema, rule registry, Playwright helpers).
  - Converted the repo’s needs into concrete decision points covering module format, build/run, tsconfig, domain typing, dynamic loading, child-process pathing, 3rd‑party types, and CI/publishing impacts.

---

## User prompt about ES

Another conversion that I want to consider for this project is a conversion from commonJS to ES modules. I have two questions about this:
(1) What are the major decisions that will be required if the project is to undergo that conversion?
(2) If both conversions are to be performed, are there efficiencies in performing them together rather than sequentially?

---

## Cursor response about ES

I'll analyze the current codebase to understand the CommonJS patterns and then address both your questions about ES module conversion and the efficiency of combining it with TypeScript conversion.

Now let me examine some more files to understand the module patterns better:

Now let me check some dynamic require patterns and child process usage:

Based on my analysis of the codebase, I can now provide comprehensive answers to both questions about CommonJS to ES modules conversion and the efficiency of combining it with TypeScript conversion.

## (1) Major decisions for CommonJS to ES modules conversion

### Module system and package.json changes

- **`package.json` `"type"` field**: Set to `"module"` to enable ES modules by default, or use `.mjs` extensions
- **Entry point updates**: Update `"main"` field and potentially add `"exports"` map for dual CJS/ESM support
- **Script execution**: All `package.json` scripts will need to handle ES modules (may need `--loader` flags or different execution)

### Import/export syntax conversion

- **134 `require()` calls** need conversion to `import` statements
- **91 `exports.` assignments** need conversion to `export` statements
- **2 `module.exports`** need conversion to `export default`
- **Dynamic requires**: The codebase has dynamic `require()` calls like `require(\`../tests/${which}\`)` that need special handling

### Child process and dynamic loading

- **`child_process.fork` paths**: Currently forks `${__dirname}/procs/doTestAct` - need to handle ES module paths
- **Dynamic module loading**: `tests/testaro.js` dynamically loads rule modules by filename - requires `import()` or registry pattern
- **Circular dependencies**: Current `require()` patterns may have circular deps that need restructuring

### Node.js built-in modules

- **`fs/promises`**: Already using modern Node.js APIs, should work with ES modules
- **`child_process`**: Fork paths need adjustment for ES module execution
- **`os`, `path`**: Standard Node.js modules, should work fine

### Third-party dependencies

- **Playwright ecosystem**: Need to verify all dependencies support ES modules
- **QualWeb, Alfa, etc.**: Check if these packages have ES module exports
- **`dotenv`**: May need different import syntax or configuration

### File extensions and resolution

- **`.js` to `.mjs`**: Decide whether to rename files or use `"type": "module"`
- **JSON imports**: Currently using `fs.readFile()` for JSON - could use `import` with `resolveJsonModule`
- **Relative imports**: All relative paths need explicit `.js` extensions in ES modules

### Runtime behavior changes

- **`__dirname` and `__filename`**: Not available in ES modules, need `import.meta.url` equivalents
- **Top-level await**: ES modules support top-level await, could simplify some async patterns
- **Strict mode**: ES modules are always in strict mode

### Backward compatibility

- **Dual package support**: Consider supporting both CJS and ESM for external consumers
- **Migration strategy**: Gradual vs. all-at-once conversion
- **External API**: How this affects consumers of the library

## (2) Efficiencies of combining TypeScript and ES modules conversion

### Significant synergies exist

#### Single migration effort

- **One codebase transformation** instead of two separate major changes
- **Unified tooling setup**: TypeScript compiler can handle both syntax conversion and type checking
- **Single testing cycle**: Validate both module system and type safety together

#### TypeScript ES module advantages

- **Better ES module support**: TypeScript has excellent ES module tooling
- **`moduleResolution: "nodenext"`**: TypeScript's modern module resolution works well with ES modules
- **Import/export typing**: TypeScript can type ES module imports more precisely than CommonJS

#### Reduced complexity

- **No intermediate state**: Avoid having to maintain both CommonJS and TypeScript simultaneously
- **Single build pipeline**: One compilation step handles both transformations
- **Unified tooling**: ESLint, Prettier, etc. can be configured once for both

#### Modern development experience

- **Native ES module support**: TypeScript + ES modules is the modern standard
- **Better tree shaking**: ES modules enable better dead code elimination
- **Future-proof**: Aligns with JavaScript ecosystem direction

### Potential challenges of combined approach

#### Complexity management

- **Two major changes at once**: Higher risk of introducing bugs
- **Debugging difficulty**: Harder to isolate whether issues are from module conversion or type conversion
- **Learning curve**: Team needs to understand both changes simultaneously

#### Migration strategy

- **All-or-nothing**: Harder to do incremental migration
- **Testing complexity**: Need to validate both module loading and type correctness
- **Rollback difficulty**: Harder to rollback one change without the other

### Recommended approach

#### Sequential with overlap (Most efficient)

1. **Phase 1**: Convert to TypeScript while keeping CommonJS
   - Add TypeScript tooling and types
   - Convert syntax to TypeScript
   - Establish type safety

2. **Phase 2**: Convert to ES modules within TypeScript
   - Use TypeScript's ES module support
   - Convert `require`/`exports` to `import`/`export`
   - Handle dynamic loading with typed `import()`

#### Benefits of this approach

- **Incremental validation**: Can test TypeScript conversion before module conversion
- **Type safety during module conversion**: TypeScript will catch module-related errors
- **Familiar tooling**: TypeScript tooling handles ES module conversion well
- **Reduced risk**: Smaller, manageable changes

#### Tooling advantages

- **TypeScript compiler**: Can transpile ES modules to CommonJS if needed during transition
- **Better error messages**: TypeScript provides clearer errors for module issues
- **IDE support**: Better autocomplete and refactoring for ES modules in TypeScript

### Specific efficiencies for this codebase

#### Dynamic loading patterns

- **Current**: `require(\`../tests/${which}\`)`
- **TypeScript + ESM**: `const module = await import(\`../tests/${which}.js\`)` with proper typing

#### Child process handling

- **Current**: `fork(\`${__dirname}/procs/doTestAct\`)`
- **TypeScript + ESM**: Use `import.meta.url` and proper ES module paths

#### JSON handling

- **Current**: `fs.readFile()` + `JSON.parse()`
- **TypeScript + ESM**: `import data from './config.json' assert { type: 'json' }` with typed interfaces

### Conclusion

**Yes, there are significant efficiencies in performing both conversions together**, especially using the sequential approach. The TypeScript tooling provides excellent support for ES module conversion, and doing both changes in a coordinated manner reduces overall migration effort while providing better type safety throughout the process.

---

## User prompt about upgrades

I would like advice on an upgrade strategy. I want to consider both of the upgrades on which you have commented above.

I also want to consider other modernizations, which may include:

1. changing package manager from npm to pnpm
2. joining Testaro, its closely related package Testilo, and possibly also a new closely related package creating a UI for these two pagkages into a single monorepo
3. adding type checking
4. using Biome for linting
5. using Playwright Test instead of plain Playwright
6. making the package container-safe so it no longer crashes when containerized
7. adding robust and user-friendly support for the easy construction of tests for customer-specific custom accessibility rules

There could be more.

My hunch is that the efficiencies in simultaneous multiple upgrades would be lost if I attempted to perform them on the entire existing codebase, and a long time would pass before the bugs were extinguished. Therefore, I want to consider an upgrade strategy that begins with a minimal package that is bug-free and is kept bug-free throughout the process, as more items are added.

For example, the initial minimal package (or monorepo) could implement only one testing tool, and it could be the most antiquated one, so that the initial design is foreseeably compatible with all of the 10 non-Testaro testing tools with respect to module type, typing, and other potential sources of incompatibility. Once it is established that the architecture succeeds with that testing tool for all of the upgrade objectives (e.g., containerizability, Playwright Test conversion), then a second tool could be added, with advantage taken of the lessons learned so far.

Does this strategy seem appropriate in this situation, or does a different strategy seem better?

---

## Cursor response about upgrades

Your strategy is **excellent** and highly appropriate for this situation. You've correctly identified that attempting all upgrades simultaneously on the entire codebase would be risky and inefficient. Let me analyze why your approach is sound and suggest some refinements.

## Why your strategy is optimal

### Risk management

- **Incremental validation**: Each step can be thoroughly tested before proceeding
- **Early failure detection**: Problems surface quickly rather than after massive changes
- **Rollback safety**: Easy to revert individual changes if issues arise
- **Learning curve**: Team can master new patterns incrementally

### Architecture validation

- **Design verification**: The minimal package proves the architecture works
- **Pattern establishment**: Creates templates for subsequent additions
- **Compatibility testing**: Ensures the chosen tool (oldest) works with all planned upgrades

### Development efficiency

- **Parallel work**: Once patterns are established, multiple tools can be added simultaneously
- **Reduced debugging**: Smaller scope makes issues easier to isolate and fix
- **Continuous delivery**: Each increment can be deployed and validated

## Recommended implementation strategy

### Phase 1: Minimal Foundation (2-4 weeks)

Create a new monorepo with:

```text
testaro-monorepo/
├── packages/
│   ├── core/           # Shared utilities, types
│   ├── testaro/        # Minimal implementation
│   └── testilo/        # Placeholder for future
├── tools/
│   └── ui/             # Future UI package
└── apps/
    └── example/        # Demo/test app
```

**Minimal testaro package should include:**

- **One testing tool**: Choose the most "antiquated" one (likely `nuVal` or `htmlcs` based on your codebase)
- **Core architecture**: Module system, typing, containerization, Playwright Test
- **Essential features**: Job processing, report generation, basic CLI

### Phase 2: Architecture Validation (1-2 weeks)

- **All upgrades applied**: TypeScript, ES modules, pnpm, Biome, Playwright Test, containerization
- **Full testing**: Unit tests, integration tests, container tests
- **Performance validation**: Ensure the architecture scales
- **Documentation**: Establish patterns and guidelines

### Phase 3: Incremental Tool Addition (2-3 weeks per tool)

Add tools in order of complexity:

1. **Simple tools first**: `nuVal`, `htmlcs`, `wave`
2. **Medium complexity**: `axe`, `ed11y`, `ibm`
3. **Complex tools**: `alfa`, `qualWeb`, `aslint`
4. **Testaro rules**: Add the custom accessibility rules

### Phase 4: Integration & Polish (2-4 weeks)

- **Testilo integration**: Add Testilo package
- **UI development**: Create the UI package
- **Custom rules framework**: Implement the extensible rules system
- **Documentation**: Complete user guides and API docs

## Specific recommendations for your upgrades

### 1. Package manager: npm → pnpm

- **Start with pnpm**: Set up the monorepo with pnpm from the beginning
- **Benefits**: Better monorepo support, faster installs, disk efficiency
- **Migration**: Use `pnpm import` to convert existing `package-lock.json`

### 2. Monorepo structure

```text
testaro-monorepo/
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                    # Shared types, utilities
│   ├── testaro/                 # Main testing engine
│   ├── testilo/                 # Report processing
│   └── ui/                      # Web interface
├── apps/
│   ├── cli/                     # Command-line interface
│   └── demo/                    # Example usage
└── tools/
    └── rule-builder/            # Custom rule creation tool
```

### 3. TypeScript + ES modules

- **Start with strict TypeScript**: `strict: true`, `noImplicitAny: true`
- **ES modules from day one**: Use `"type": "module"` in package.json
- **Modern tooling**: Vite or esbuild for fast builds

### 4. Biome for linting

- **Replace ESLint**: Biome is faster and more modern
- **Configuration**: Start with default rules, customize incrementally
- **Pre-commit hooks**: Ensure code quality

### 5. Playwright Test

- **Replace custom test orchestration**: Use Playwright Test's built-in features
- **Parallel execution**: Better performance than current sequential approach
- **Better reporting**: Built-in HTML reports and screenshots

### 6. Containerization

- **Multi-stage Dockerfile**: Separate build and runtime stages
- **Health checks**: Ensure container starts properly
- **Resource limits**: Prevent crashes from memory issues
- **Volume mounts**: For persistent data

### 7. Custom rules framework

- **Plugin architecture**: Allow external rule definitions
- **TypeScript interfaces**: Strongly typed rule contracts
- **Validation**: Ensure custom rules follow patterns
- **Documentation**: Auto-generate docs from rule definitions

## Alternative strategies to consider

### Option A: Your proposed strategy (Recommended)

- **Pros**: Low risk, learnable, scalable
- **Cons**: Longer timeline, more phases
- **Best for**: Complex codebase, team learning, production stability

### Option B: Big bang approach

- **Pros**: Faster completion, single migration effort
- **Cons**: High risk, difficult debugging, potential for major issues
- **Best for**: Simple codebase, experienced team, non-production use

### Option C: Hybrid approach

- **Phase 1**: Create new architecture with minimal features
- **Phase 2**: Migrate existing codebase to new architecture
- **Phase 3**: Add remaining features
- **Pros**: Balance of risk and speed
- **Cons**: More complex migration path

## Specific tool selection for minimal package

Based on your codebase analysis, I recommend starting with **`nuVal`** as your minimal tool because:

- **Simple implementation**: Basic HTML validation
- **Minimal dependencies**: Fewer external packages to manage
- **Clear patterns**: Easy to establish the architecture
- **Compatibility**: Works with all planned upgrades
- **Debugging**: Simple enough to troubleshoot issues quickly

## Success metrics for each phase

### Phase 1 success criteria

- [ ] Minimal package runs without errors
- [ ] All upgrades (TypeScript, ES modules, etc.) work
- [ ] Container runs successfully
- [ ] Basic CLI works
- [ ] Report generation works

### Phase 2 success criteria

- [ ] Performance meets requirements
- [ ] Memory usage is stable
- [ ] Error handling is robust
- [ ] Documentation is complete

### Phase 3 success criteria

- [ ] Each tool addition takes < 1 week
- [ ] No regression in existing functionality
- [ ] New patterns are established
- [ ] Team is comfortable with process

## Conclusion about upgrades

Your strategy is **highly appropriate** and shows excellent engineering judgment. The incremental approach will:

1. **Minimize risk** while maximizing learning
2. **Establish patterns** that can be replicated
3. **Enable parallel development** once the foundation is solid
4. **Provide continuous value** throughout the process
5. **Allow for course correction** based on early learnings

The key is to start with the most constrained, simplest possible implementation and gradually add complexity. This approach has proven successful for many major software modernizations and is particularly well-suited for your complex, multi-faceted upgrade requirements.

```plaintext
testaro-monorepo/
├── packages/
│   ├── core/           # Shared utilities, types
│   ├── testaro/        # Minimal implementation
│   └── testilo/        # Placeholder for future
├── tools/
│   └── ui/             # Future UI package
└── apps/
    └── example/        # Demo/test app
```

```plaintext
testaro-monorepo/
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                    # Shared types, utilities
│   ├── testaro/                 # Main testing engine
│   ├── testilo/                 # Report processing
│   └── ui/                      # Web interface
├── apps/
│   ├── cli/                     # Command-line interface
│   └── demo/                    # Example usage
└── tools/
    └── rule-builder/            # Custom rule creation tool
```

---

## User comments on upgrades

Comments on the above suggestions:

The `nuVal` tool is one of three (also `wave` and `wax`) that operate as APIs, with the substantial disadvantage that they can test only publicly reachable pages. The `nuVal` tool could be brought into the package (see How to to run your own copy of the [Nu Html Checker](@https://validator.w3.org/nu/about.html)). Until then, it seems to me that it avoids presenting incompatibility problems, so I believe another tool would be better to start with. But that decision could await the start of the upgrade project.

I forgot to mention the modernization of validation. I am using that term in place of unit, integration, and end-to-end testing, because the entire project is a testing project and it gets confusing when the word “test” can refer both to the primary functionality of the project and the verification that the project works correctly. Currently validation is limited to the Testaro tool’s 55 or so tests. The idea behind that is that this project treats the 10 external tools like oracles that make claims, but these claims are inherently suspect, so for any tool there are 10 others that may perform their own version of any test. When tools disagree, Testaro does not try to decide which is correct. Instead, it uses Testilo to find similar tests of other tools and collect the results together so users can experience the disagreements and decide for themselves which tools are correct. Such user judgments can be collected by the UI and lead to deprecations by Testilo so that dubious tests are disregarded. Validation of the Testaro tests is currently exposed in a nonstandard way, and I want to consider converting it to a widely accepted interface.

I also wonder whether Turborepo should be used if the project becomes a monorepo.

---

## Cursor comments on upgrades

Excellent clarifications! Your insights about `nuVal` and the validation approach significantly refine the strategy. Let me address your points and provide updated recommendations.

## Tool selection reconsideration

You're absolutely right about `nuVal`'s limitations. Since it requires publicly reachable pages and operates as an API, it's not ideal for the minimal package. Better alternatives for the initial tool:

### Recommended alternatives

1. **`htmlcs`** - Pure JavaScript, no external dependencies, works on any HTML
2. **`wave`** - Also API-based, so same limitations as `nuVal`
3. **`wax`** - API-based as well
4. **`axe`** - Self-contained, works on any page, excellent for establishing patterns

**I recommend starting with `axe`** because:

- **Self-contained**: No external API dependencies
- **Mature ecosystem**: Well-established patterns for TypeScript, ES modules, etc.
- **Comprehensive**: Covers many accessibility rules, good for pattern establishment
- **Playwright integration**: Has excellent Playwright Test support
- **Container-friendly**: No external network dependencies

## Validation modernization strategy

Your distinction between "testing" (primary functionality) and "validation" (verification) is crucial. Here's how to modernize the validation approach:

### Current validation approach

- **55 Testaro tests** as oracles
- **Cross-tool comparison** via Testilo
- **User judgment collection** for deprecation decisions

### Modernized validation strategy

#### 1. Standardized test interfaces

```typescript
// Core validation interface
interface ValidationSuite {
  name: string;
  version: string;
  run(page: Page, options: ValidationOptions): Promise<ValidationResult>;
}

// Tool-specific validation
interface ToolValidation extends ValidationSuite {
  tool: 'axe' | 'wave' | 'htmlcs' | 'nuVal' | 'wax' | 'alfa' | 'qualWeb' | 'ibm' | 'ed11y' | 'aslint';
  rules: RuleDefinition[];
}
```

#### 2. Playwright Test integration

```typescript
// validation/tests/axe.spec.ts
import { test, expect } from '@playwright/test';
import { AxeValidation } from '../packages/core/src/validations/axe';

test.describe('Axe Tool Validation', () => {
  test('should detect basic accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/test-pages/basic-violations.html');

    const validation = new AxeValidation();
    const result = await validation.run(page);

    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].id).toBe('color-contrast');
  });
});
```

#### 3. Cross-tool validation framework

```typescript
// validation/tests/cross-tool.spec.ts
test.describe('Cross-Tool Validation', () => {
  test('should identify tool disagreements', async ({ page }) => {
    const results = await Promise.all([
      axeValidation.run(page),
      waveValidation.run(page),
      htmlcsValidation.run(page)
    ]);

    const disagreements = findDisagreements(results);
    expect(disagreements).toBeDefined();
    expect(disagreements.length).toBeGreaterThan(0);
  });
});
```

#### 4. User judgment collection

```typescript
// packages/ui/src/components/ValidationReview.tsx
interface ValidationReview {
  testId: string;
  toolResults: ToolResult[];
  userJudgment: 'correct' | 'incorrect' | 'unclear';
  reasoning: string;
}
```

## Turborepo for monorepo management

**Yes, absolutely use Turborepo!** It's specifically designed for this use case and provides significant advantages:

### Turborepo benefits

- **Incremental builds**: Only rebuilds what changed
- **Parallel execution**: Runs tasks across packages simultaneously
- **Caching**: Intelligent caching of build artifacts
- **Dependency management**: Tracks inter-package dependencies
- **CI optimization**: Dramatically faster CI/CD pipelines

### Recommended monorepo structure

```text
testaro-monorepo/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                    # Shared types, utilities
│   ├── testaro/                 # Main testing engine
│   ├── testilo/                 # Report processing
│   ├── ui/                      # Web interface
│   └── validation/              # Validation framework
├── apps/
│   ├── cli/                     # Command-line interface
│   ├── demo/                    # Example usage
│   └── validation-runner/       # Validation test runner
└── tools/
    └── rule-builder/            # Custom rule creation tool
```

### turbo.json configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "validation": {
      "dependsOn": ["build"],
      "outputs": ["validation-results/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

## Updated minimal package strategy

### Phase 1: Minimal Foundation with `axe`

```typescript
// packages/testaro/src/tools/axe.ts
export class AxeTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    const results = await new AxeBuilder({ page })
      .withTags(options.tags)
      .analyze();

    return this.standardizeResults(results);
  }
}
```

### Phase 2: Validation framework

```typescript
// packages/validation/src/suites/axe-validation.ts
export class AxeValidationSuite implements ValidationSuite {
  async run(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Run axe on known test pages
    // Compare results against expected outcomes
    // Return validation report
  }
}
```

### Phase 3: Cross-tool validation

```typescript
// packages/validation/src/cross-tool-validator.ts
export class CrossToolValidator {
  async validateDisagreements(results: ToolResult[]): Promise<DisagreementReport> {
    // Identify where tools disagree
    // Collect user judgments
    // Update deprecation rules
  }
}
```

## Implementation timeline

### Week 1-2: Minimal package with `axe`

- [ ] Set up Turborepo monorepo
- [ ] Implement `axe` tool with all upgrades
- [ ] Basic validation framework
- [ ] Containerization

### Week 3-4: Validation modernization

- [ ] Playwright Test integration
- [ ] Standardized validation interfaces
- [ ] Cross-tool validation framework
- [ ] User judgment collection system

### Week 5-6: Tool addition

- [ ] Add second tool (e.g., `htmlcs`)
- [ ] Validate cross-tool patterns
- [ ] Performance testing

### Week 7-8: UI and Testilo integration

- [ ] Basic UI for judgment collection
- [ ] Testilo integration
- [ ] Custom rules framework

## Key advantages of this approach

1. `axe` as starting point: Self-contained, mature, well-documented
2. Turborepo: Handles monorepo complexity efficiently
3. Modern validation: Playwright Test provides excellent testing infrastructure
4. Scalable architecture: Patterns established with `axe` apply to all tools
5. User-centric: Maintains the oracle-based approach while modernizing the interface

This strategy addresses your concerns about `nuVal`'s limitations while providing a solid foundation for the more complex tools that follow. The validation modernization ensures the project maintains its unique value proposition while adopting modern testing practices.

```typescript
// Core validation interface
interface ValidationSuite {
  name: string;
  version: string;
  run(page: Page, options: ValidationOptions): Promise<ValidationResult>;
}

// Tool-specific validation
interface ToolValidation extends ValidationSuite {
  tool: 'axe' | 'wave' | 'htmlcs' | 'nuVal' | 'wax' | 'alfa' | 'qualWeb' | 'ibm' | 'ed11y' | 'aslint';
  rules: RuleDefinition[];
}
```

```typescript
// validation/tests/axe.spec.ts
import { test, expect } from '@playwright/test';
import { AxeValidation } from '../packages/core/src/validations/axe';

test.describe('Axe Tool Validation', () => {
  test('should detect basic accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/test-pages/basic-violations.html');

    const validation = new AxeValidation();
    const result = await validation.run(page);

    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].id).toBe('color-contrast');
  });
});
```

```typescript
// validation/tests/cross-tool.spec.ts
test.describe('Cross-Tool Validation', () => {
  test('should identify tool disagreements', async ({ page }) => {
    const results = await Promise.all([
      axeValidation.run(page),
      waveValidation.run(page),
      htmlcsValidation.run(page)
    ]);

    const disagreements = findDisagreements(results);
    expect(disagreements).toBeDefined();
    expect(disagreements.length).toBeGreaterThan(0);
  });
});
```

```typescript
// packages/ui/src/components/ValidationReview.tsx
interface ValidationReview {
  testId: string;
  toolResults: ToolResult[];
  userJudgment: 'correct' | 'incorrect' | 'unclear';
  reasoning: string;
}
```

```plaintext
testaro-monorepo/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                    # Shared types, utilities
│   ├── testaro/                 # Main testing engine
│   ├── testilo/                 # Report processing
│   ├── ui/                      # Web interface
│   └── validation/              # Validation framework
├── apps/
│   ├── cli/                     # Command-line interface
│   ├── demo/                    # Example usage
│   └── validation-runner/       # Validation test runner
└── tools/
    └── rule-builder/            # Custom rule creation tool
```

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "validation": {
      "dependsOn": ["build"],
      "outputs": ["validation-results/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

```typescript
// packages/testaro/src/tools/axe.ts
export class AxeTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    const results = await new AxeBuilder({ page })
      .withTags(options.tags)
      .analyze();

    return this.standardizeResults(results);
  }
}
```

```typescript
// packages/validation/src/suites/axe-validation.ts
export class AxeValidationSuite implements ValidationSuite {
  async run(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Run axe on known test pages
    // Compare results against expected outcomes
    // Return validation report
  }
}
```

```typescript
// packages/validation/src/cross-tool-validator.ts
export class CrossToolValidator {
  async validateDisagreements(results: ToolResult[]): Promise<DisagreementReport> {
    // Identify where tools disagree
    // Collect user judgments
    // Update deprecation rules
  }
}
```

---

## User comment about tool sequence

But Axe is probably not the most antiquated tool. I would expect ASLint and HTML CodeSniffer to be the most antiquated. Alfa, Axe, Editoria11y, IBM Equal Access, and QualWeb are all currently being actively maintained. I have no intuition as to which of those might pose upgrade problems, but inspection could reveal that.

---

## Cursor reply about tool sequence

You're absolutely right! Let me analyze the tools by their maintenance status and potential upgrade challenges.

Perfect! Now I can see the implementation details. You're absolutely correct about the maintenance status and potential upgrade challenges. Let me analyze the tools by their implementation patterns and maintenance status:

## Tool Analysis by Maintenance Status & Upgrade Challenges

### Most Antiquated (Best for initial minimal package)

#### 1. HTML CodeSniffer (`htmlcs`) - RECOMMENDED

- **Maintenance**: Squiz Labs, appears less actively maintained
- **Implementation**: Pure JavaScript, self-contained, reads from local file
- **Upgrade challenges**:
  - Uses `fs.readFile()` to load script from local file
  - Injects script into page DOM
  - Uses global `window.HTMLCS_RUNNER` API
  - String-based result parsing
- **Why it's ideal**: Simple, self-contained, no external dependencies, clear patterns

#### 2. ASLint (`aslint`) - SECOND CHOICE

- **Maintenance**: eSSENTIAL Accessibility, moderate maintenance
- **Implementation**: More complex, uses bundled script from `node_modules`
- **Upgrade challenges**:
  - Reads from `node_modules/aslint-testaro/aslint.bundle.js`
  - Complex script injection with nonce handling
  - Waits for DOM element attachment
  - JSON result parsing
- **Why it's good**: More modern patterns, but still self-contained

### Actively Maintained (Higher upgrade risk)

#### 3. Axe (`axe`)

- **Maintenance**: Deque, very active
- **Implementation**: Uses `axe-playwright` package
- **Upgrade challenges**: Modern package, frequent updates, complex API

#### 4. Alfa (`alfa`)

- **Maintenance**: Siteimprove, very active
- **Implementation**: Uses `@siteimprove/alfa-*` packages
- **Upgrade challenges**: Modern TypeScript packages, complex API

#### 5. QualWeb (`qualWeb`)

- **Maintenance**: University of Lisbon, active
- **Implementation**: Uses `@qualweb/*` packages
- **Upgrade challenges**: Modern packages, complex configuration

## Recommended Strategy: Start with HTML CodeSniffer

### Why HTML CodeSniffer is perfect for the minimal package

1. Simple implementation pattern:

   ```typescript
   // Current pattern (easy to modernize)
   const scriptText = await fs.readFile(`${__dirname}/../htmlcs/HTMLCS.js`, 'utf8');
   const issues = await page.evaluate((scriptText, scriptNonce) => {
     // Inject and run HTMLCS
   }, scriptText, scriptNonce);
   ```

2. **Self-contained**: No external package dependencies
3. **Clear upgrade path**: Easy to convert to ES modules and TypeScript
4. **Established patterns**: The script injection pattern will work for other tools
5. **Minimal complexity**: String parsing is straightforward to type

### Implementation plan for HTML CodeSniffer

#### Phase 1: Minimal HTML CodeSniffer package

```typescript
// packages/testaro/src/tools/htmlcs.ts
export class HTMLCodeSnifferTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    const scriptText = await fs.readFile(
      new URL('../htmlcs/HTMLCS.js', import.meta.url),
      'utf8'
    );

    const issues = await page.evaluate(
      (scriptText, scriptNonce, rules) => {
        // Modern ES module version of current logic
      },
      scriptText,
      options.scriptNonce,
      options.rules
    );

    return this.standardizeResults(issues);
  }
}
```

#### Phase 2: Validation framework for HTML CodeSniffer

```typescript
// packages/validation/src/suites/htmlcs-validation.ts
export class HTMLCodeSnifferValidationSuite implements ValidationSuite {
  async run(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Test HTML CodeSniffer on known test pages
    // Validate rule detection accuracy
    // Check result standardization
  }
}
```

### Why this approach works

1. **Proves architecture**: HTML CodeSniffer will validate all upgrade patterns
2. **Simple debugging**: String-based results are easy to troubleshoot
3. **Clear patterns**: Script injection pattern applies to other tools
4. **Minimal risk**: Self-contained tool reduces external dependencies
5. **Learning curve**: Team can master patterns with simple tool first

### Tool addition order after HTML CodeSniffer

1. ASLint (similar complexity, bundled script pattern)
2. Axe (modern package, different patterns)
3. Alfa (complex TypeScript packages)
4. QualWeb (most complex, modern packages)
5. Testaro rules (custom rules framework)

### Key advantages of starting with HTML CodeSniffer

- No external package dependencies to manage during upgrades
- Simple string parsing that's easy to type with TypeScript
- Clear script injection pattern that applies to other tools
- Self-contained tool that won't break during monorepo setup
- **Established patterns** that can be replicated for other tools

This approach gives you the most antiquated tool (as requested) while providing a solid foundation for all the planned upgrades. The patterns established with HTML CodeSniffer will directly apply to the more complex tools that follow.

```typescript
// Current pattern (easy to modernize)
const scriptText = await fs.readFile(`${__dirname}/../htmlcs/HTMLCS.js`, 'utf8');
const issues = await page.evaluate((scriptText, scriptNonce) => {
  // Inject and run HTMLCS
}, scriptText, scriptNonce);
```

```typescript
// packages/testaro/src/tools/htmlcs.ts
export class HTMLCodeSnifferTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    const scriptText = await fs.readFile(
      new URL('../htmlcs/HTMLCS.js', import.meta.url),
      'utf8'
    );

    const issues = await page.evaluate(
      (scriptText, scriptNonce, rules) => {
        // Modern ES module version of current logic
      },
      scriptText,
      options.scriptNonce,
      options.rules
    );

    return this.standardizeResults(issues);
  }
}
```

```typescript
// packages/validation/src/suites/htmlcs-validation.ts
export class HTMLCodeSnifferValidationSuite implements ValidationSuite {
  async run(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Test HTML CodeSniffer on known test pages
    // Validate rule detection accuracy
    // Check result standardization
  }
}
```

---

## User comment on tool selection

The purpose of starting with an antiquated tool was to maximize the risk of unmodernizability, but your advice is now advocating this tactic because of its ease, rather than because of its difficulty. We should be clear about the considerations that motivate our decisions.

---

## Cursor reply on tool selection

You're absolutely right, and I apologize for the confusion. Let me clarify the actual considerations that should motivate our decisions.

## The Real Considerations

### Primary Goal: Maximize Upgrade Risk Detection

The purpose of starting with an antiquated tool is to **stress-test the architecture** by encountering the most challenging upgrade scenarios early. We want to discover what breaks, what's incompatible, and what requires significant rework.

### Secondary Goal: Establish Robust Patterns

Once we've proven the architecture can handle the most difficult cases, we can confidently apply those patterns to easier tools.

## Re-evaluating Tool Selection by Upgrade Difficulty

### Most Challenging (Highest Risk) - RECOMMENDED

#### 1. ASLint (`aslint`) - HIGHEST RISK

- Why it's the most challenging:
  - Complex dependency chain: Uses `aslint-testaro` package with bundled script
  - Script injection complexity: Multiple script elements, nonce handling, DOM waiting
  - **Modern package management**: Depends on `node_modules` structure
  - **Error handling**: Complex timeout and attachment logic
  - **JSON parsing**: Structured result processing
- **Upgrade challenges**:
  - **ES modules**: `node_modules` path resolution changes
  - **TypeScript**: Complex script injection typing
  - **Containerization**: File system access patterns
  - **Monorepo**: Package dependency management
  - **Playwright Test**: Async waiting patterns

#### 2. HTML CodeSniffer (`htmlcs`) - MEDIUM RISK

- Why it's moderately challenging:
  - **File system access**: `fs.readFile()` for script loading
  - **Global variable usage**: `window.HTMLCS_RUNNER` API
  - **String parsing**: Complex result processing
- **Upgrade challenges**:
  - **ES modules**: `__dirname` replacement
  - **TypeScript**: String parsing typing
  - **Containerization**: File path resolution

### Least Challenging (Lowest Risk)

#### 3. Axe (`axe`) - LOWEST RISK

- Why it's easiest:
  - **Modern package**: `axe-playwright` with TypeScript support
  - **Clean API**: Well-documented, modern patterns
  - **Active maintenance**: Regular updates, good documentation
- **Upgrade challenges**: Minimal, mostly configuration

## Recommended Strategy: Start with ASLint

### Why ASLint is the right choice for stress-testing

1. Maximum complexity: Most challenging upgrade scenarios
2. Multiple failure points: Script injection, file system, async waiting, JSON parsing
3. **Modern package dependencies**: Tests monorepo package management
4. **Containerization challenges**: File system access patterns
5. **TypeScript complexity**: Complex typing for script injection and results

### What we'll learn from ASLint

#### Module System Challenges

- How to handle `node_modules` paths in ES modules
- Script injection with nonce handling
- File system access patterns

#### TypeScript Challenges

- Typing complex script injection
- Result parsing and validation
- Error handling patterns

#### Containerization Challenges

- File system access in containers
- Script loading and execution
- Timeout and waiting patterns

#### Monorepo Challenges

- Package dependency management
- Cross-package file access
- Build and deployment patterns

### Implementation approach

#### Phase 1: Stress-test with ASLint

```typescript
// This will be HARD - that's the point
export class ASLintTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    // Challenge 1: ES module file system access
    const aslintRunner = await fs.readFile(
      new URL('../procs/aslint.js', import.meta.url),
      'utf8'
    );

    // Challenge 2: Monorepo package resolution
    const aslintBundle = await fs.readFile(
      new URL('../node_modules/aslint-testaro/aslint.bundle.js', import.meta.url),
      'utf8'
    );

    // Challenge 3: Complex script injection with typing
    await page.evaluate(
      (args: ScriptInjectionArgs) => {
        // Complex script injection logic
      },
      { scriptNonce: options.scriptNonce, aslintBundle, aslintRunner }
    );

    // Challenge 4: Async waiting with timeout
    const reportLoc = page.locator('#aslintResult');
    await reportLoc.waitFor({
      state: 'attached',
      timeout: 1000 * options.timeLimit
    });

    // Challenge 5: Complex result parsing
    const actReport = await reportLoc.textContent();
    const result = JSON.parse(actReport);

    return this.standardizeResults(result);
  }
}
```

#### Phase 2: Apply lessons to easier tools

Once we've solved ASLint's challenges, HTML CodeSniffer and Axe will be straightforward.

### Success criteria for ASLint stress-test

- [ ] ES modules: File system access works with `import.meta.url`
- [ ] TypeScript: Complex script injection is properly typed
- [ ] Containerization: Script loading works in containers
- [ ] Monorepo: Package dependencies resolve correctly
- [ ] **Playwright Test**: Async waiting patterns work
- [ ] **Error handling**: Robust error handling for all failure points

### Why this approach is correct

1. **Risk mitigation**: Discover problems early when scope is small
2. **Pattern establishment**: Solve the hardest problems first
3. **Confidence building**: Prove the architecture can handle anything
4. **Learning**: Team masters complex patterns early
5. **Efficiency**: Easier tools become trivial after solving hard ones

### Timeline expectations

- **ASLint**: 3-4 weeks (stress-testing phase)
- **HTML CodeSniffer**: 1 week (apply established patterns)
- **Axe**: 1 week (modern package, easy patterns)
- **Remaining tools**: 1-2 weeks each (established patterns)

This approach ensures we encounter and solve the most challenging upgrade scenarios early, making the entire project more robust and efficient.

```typescript
// This will be HARD - that's the point
export class ASLintTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    // Challenge 1: ES module file system access
    const aslintRunner = await fs.readFile(
      new URL('../procs/aslint.js', import.meta.url),
      'utf8'
    );

    // Challenge 2: Monorepo package resolution
    const aslintBundle = await fs.readFile(
      new URL('../node_modules/aslint-testaro/aslint.bundle.js', import.meta.url),
      'utf8'
    );

    // Challenge 3: Complex script injection with typing
    await page.evaluate(
      (args: ScriptInjectionArgs) => {
        // Complex script injection logic
      },
      { scriptNonce: options.scriptNonce, aslintBundle, aslintRunner }
    );

    // Challenge 4: Async waiting with timeout
    const reportLoc = page.locator('#aslintResult');
    await reportLoc.waitFor({
      state: 'attached',
      timeout: 1000 * options.timeLimit
    });

    // Challenge 5: Complex result parsing
    const actReport = await reportLoc.textContent();
    const result = JSON.parse(actReport);

    return this.standardizeResults(result);
  }
}
```

---

## User prompt about packaging

The recommended monorepo structure above provides for Testaro being a package. Is it wise to consider making each testing tool that is currently within Testaro a distinct package? I imagine some benefits from this:
(1) Protection of the rest of Testaro from disruption when a particular testing tool is revised.
(2) Parallelization of testing service, with distinct servers running single tools on the same target page, with their reports consolidated by Testaro, decreasing completion time.
(3) Use of a configurable testing tool as the enforcer of any customer-specific custom rules.

---

## Cursor reply about packaging

Excellent strategic thinking! Your analysis of the benefits is spot-on, and this approach would significantly improve the architecture. Let me analyze the implications and provide a refined monorepo structure.

## Benefits Analysis

### 1. Isolation & Protection

- **Tool-specific updates**: Each tool can be updated independently
- **Dependency isolation**: Tool-specific dependencies don't conflict
- **Versioning**: Each tool can have its own versioning strategy
- **Testing**: Tool-specific validation and testing

### 2. Parallelization & Performance

- **Horizontal scaling**: Run tools on separate servers/containers
- **Resource optimization**: Allocate resources per tool requirements
- **Fault tolerance**: One tool failure doesn't affect others
- **Load balancing**: Distribute tool execution across infrastructure

### 3. Custom Rules Framework

- **Plugin architecture**: Each tool becomes a plugin
- **Customer-specific tools**: Custom tools as separate packages
- **Rule enforcement**: Tools can enforce custom business rules
- **Extensibility**: Easy to add new tools without core changes

## Recommended Monorepo Structure

```text
testaro-monorepo/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                           # Shared utilities, types, interfaces
│   ├── testaro/                        # Main orchestrator
│   ├── testilo/                        # Report processing
│   ├── ui/                             # Web interface
│   ├── tools/                          # Tool packages
│   │   ├── axe/                        # Axe tool package
│   │   ├── htmlcs/                     # HTML CodeSniffer package
│   │   ├── aslint/                     # ASLint package
│   │   ├── alfa/                       # Alfa package
│   │   ├── qualweb/                    # QualWeb package
│   │   ├── ibm/                        # IBM Accessibility Checker package
│   │   ├── ed11y/                      # Editoria11y package
│   │   ├── nuval/                      # Nu Html Checker package
│   │   ├── wave/                       # WAVE package
│   │   ├── wax/                        # WallyAX package
│   │   └── testaro-rules/              # Testaro custom rules package
│   ├── validation/                     # Validation framework
│   └── custom-tools/                   # Customer-specific tools
│       ├── customer-a-rules/           # Customer A's custom rules
│       └── customer-b-rules/           # Customer B's custom rules
├── apps/
│   ├── cli/                            # Command-line interface
│   ├── demo/                           # Example usage
│   ├── validation-runner/              # Validation test runner
│   └── tool-server/                    # Individual tool server
└── tools/
    └── rule-builder/                   # Custom rule creation tool
```

## Tool Package Structure

### Individual Tool Package Example

```text
packages/tools/axe/
├── package.json
├── src/
│   ├── index.ts                        # Main tool interface
│   ├── tool.ts                        # Tool implementation
│   ├── types.ts                       # Tool-specific types
│   └── validation.ts                  # Tool validation
├── tests/
│   ├── tool.spec.ts                   # Tool-specific tests
│   └── validation.spec.ts             # Tool validation tests
└── README.md
```

### Tool Package Interface

```typescript
// packages/tools/axe/src/types.ts
export interface AxeToolOptions {
  tags?: string[];
  rules?: string[];
  timeout?: number;
}

export interface AxeToolResult {
  violations: AxeViolation[];
  passes: AxePass[];
  incomplete: AxeIncomplete[];
  inapplicable: AxeInapplicable[];
}

// packages/tools/axe/src/tool.ts
export class AxeTool implements TestingTool {
  async run(page: Page, options: AxeToolOptions): Promise<AxeToolResult> {
    // Tool-specific implementation
  }

  async validate(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Tool-specific validation
  }
}
```

## Core Orchestrator Package

### Testaro Main Package

```typescript
// packages/testaro/src/orchestrator.ts
export class TestaroOrchestrator {
  private tools: Map<string, TestingTool> = new Map();

  async registerTool(name: string, tool: TestingTool): Promise<void> {
    this.tools.set(name, tool);
  }

  async runTools(
    page: Page,
    toolConfigs: ToolConfig[]
  ): Promise<ToolResult[]> {
    // Parallel execution of tools
    const results = await Promise.all(
      toolConfigs.map(config => this.runTool(page, config))
    );

    return results;
  }

  private async runTool(
    page: Page,
    config: ToolConfig
  ): Promise<ToolResult> {
    const tool = this.tools.get(config.name);
    if (!tool) {
      throw new Error(`Tool ${config.name} not found`);
    }

    return await tool.run(page, config.options);
  }
}
```

## Parallelization Architecture

### Tool Server Implementation

```typescript
// apps/tool-server/src/server.ts
export class ToolServer {
  private tools: Map<string, TestingTool> = new Map();

  async start(port: number): Promise<void> {
    // Register available tools
    await this.registerTools();

    // Start HTTP server
    const server = express();
    server.post('/run/:tool', this.handleToolRequest.bind(this));
    server.listen(port);
  }

  private async handleToolRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    const { tool } = req.params;
    const { pageData, options } = req.body;

    const toolInstance = this.tools.get(tool);
    if (!toolInstance) {
      res.status(404).json({ error: 'Tool not found' });
      return;
    }

    // Run tool on provided page data
    const result = await toolInstance.run(pageData, options);
    res.json(result);
  }
}
```

### Distributed Execution

```typescript
// packages/testaro/src/distributed-executor.ts
export class DistributedExecutor {
  private toolServers: Map<string, string> = new Map();

  async runTools(
    page: Page,
    toolConfigs: ToolConfig[]
  ): Promise<ToolResult[]> {
    // Distribute tools across servers
    const serverAssignments = this.assignToolsToServers(toolConfigs);

    // Execute tools in parallel
    const results = await Promise.all(
      serverAssignments.map(assignment =>
        this.executeOnServer(assignment.server, assignment.tools, page)
      )
    );

    return results.flat();
  }

  private async executeOnServer(
    server: string,
    tools: ToolConfig[],
    page: Page
  ): Promise<ToolResult[]> {
    // Send page data and tool configs to server
    const response = await fetch(`${server}/run`, {
      method: 'POST',
      body: JSON.stringify({ tools, pageData: await page.content() })
    });

    return await response.json();
  }
}
```

## Custom Rules Framework

### Custom Tool Package

```typescript
// packages/custom-tools/customer-a-rules/src/index.ts
export class CustomerARulesTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    // Customer-specific rule implementations
    const violations = await this.checkCustomRules(page, options.rules);

    return {
      violations,
      passes: [],
      incomplete: [],
      inapplicable: []
    };
  }

  private async checkCustomRules(
    page: Page,
    rules: string[]
  ): Promise<Violation[]> {
    // Implement customer-specific business rules
    const results: Violation[] = [];

    for (const rule of rules) {
      const violations = await this.checkRule(page, rule);
      results.push(...violations);
    }

    return results;
  }
}
```

## Implementation Benefits

### 1. Isolation & Protection benefit

- **Independent updates**: Each tool can be updated without affecting others
- **Dependency management**: Tool-specific dependencies are isolated
- **Versioning**: Each tool follows its own versioning strategy
- **Testing**: Tool-specific validation and testing

### 2. Parallelization & Performance benefit

- **Horizontal scaling**: Tools can run on separate servers
- **Resource optimization**: Allocate resources per tool requirements
- **Fault tolerance**: One tool failure doesn't affect others
- **Load balancing**: Distribute tool execution across infrastructure

### 3. Custom Rules Framework benefit

- **Plugin architecture**: Each tool becomes a plugin
- **Customer-specific tools**: Custom tools as separate packages
- **Rule enforcement**: Tools can enforce custom business rules
- **Extensibility**: Easy to add new tools without core changes

## Migration Strategy

### Phase 1: Tool Package Extraction

1. Extract each tool into its own package
2. Establish common interfaces
3. Implement tool-specific validation
4. Test individual tool packages

### Phase 2: Orchestrator Implementation

1. Implement Testaro orchestrator
2. Add parallel execution support
3. Implement distributed execution
4. Test orchestrator with tool packages

### Phase 3: Custom Rules Framework

1. Implement custom tool interface
2. Create example custom tools
3. Add rule builder tool
4. Test custom rules framework

### Phase 4: Production Deployment

1. Deploy tool servers
2. Implement load balancing
3. Add monitoring and logging
4. Performance optimization

## Conclusion about packaging

Your suggestion to make each testing tool a distinct package is **architecturally sound** and provides significant benefits:

1. **Isolation**: Protects the rest of Testaro from tool-specific changes
2. **Parallelization**: Enables distributed execution and performance optimization
3. **Customization**: Supports customer-specific rules and tools
4. **Scalability**: Allows horizontal scaling of tool execution
5. **Maintainability**: Easier to manage and update individual tools

This approach transforms Testaro from a monolithic testing tool into a **distributed testing platform** that can scale horizontally and support custom business rules. The monorepo structure provides the benefits of a unified codebase while maintaining the flexibility of independent tool packages.

```plaintext
testaro-monorepo/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                           # Shared utilities, types, interfaces
│   ├── testaro/                        # Main orchestrator
│   ├── testilo/                        # Report processing
│   ├── ui/                             # Web interface
│   ├── tools/                          # Tool packages
│   │   ├── axe/                        # Axe tool package
│   │   ├── htmlcs/                     # HTML CodeSniffer package
│   │   ├── aslint/                     # ASLint package
│   │   ├── alfa/                       # Alfa package
│   │   ├── qualweb/                    # QualWeb package
│   │   ├── ibm/                        # IBM Accessibility Checker package
│   │   ├── ed11y/                      # Editoria11y package
│   │   ├── nuval/                      # Nu Html Checker package
│   │   ├── wave/                       # WAVE package
│   │   ├── wax/                        # WallyAX package
│   │   └── testaro-rules/              # Testaro custom rules package
│   ├── validation/                     # Validation framework
│   └── custom-tools/                   # Customer-specific tools
│       ├── customer-a-rules/           # Customer A's custom rules
│       └── customer-b-rules/           # Customer B's custom rules
├── apps/
│   ├── cli/                            # Command-line interface
│   ├── demo/                           # Example usage
│   ├── validation-runner/              # Validation test runner
│   └── tool-server/                    # Individual tool server
└── tools/
    └── rule-builder/                   # Custom rule creation tool
```

```plaintext
packages/tools/axe/
├── package.json
├── src/
│   ├── index.ts                        # Main tool interface
│   ├── tool.ts                        # Tool implementation
│   ├── types.ts                       # Tool-specific types
│   └── validation.ts                  # Tool validation
├── tests/
│   ├── tool.spec.ts                   # Tool-specific tests
│   └── validation.spec.ts             # Tool validation tests
└── README.md
```

```typescript
// packages/tools/axe/src/types.ts
export interface AxeToolOptions {
  tags?: string[];
  rules?: string[];
  timeout?: number;
}

export interface AxeToolResult {
  violations: AxeViolation[];
  passes: AxePass[];
  incomplete: AxeIncomplete[];
  inapplicable: AxeInapplicable[];
}

// packages/tools/axe/src/tool.ts
export class AxeTool implements TestingTool {
  async run(page: Page, options: AxeToolOptions): Promise<AxeToolResult> {
    // Tool-specific implementation
  }

  async validate(page: Page, options: ValidationOptions): Promise<ValidationResult> {
    // Tool-specific validation
  }
}
```

```typescript
// packages/testaro/src/orchestrator.ts
export class TestaroOrchestrator {
  private tools: Map<string, TestingTool> = new Map();

  async registerTool(name: string, tool: TestingTool): Promise<void> {
    this.tools.set(name, tool);
  }

  async runTools(
    page: Page,
    toolConfigs: ToolConfig[]
  ): Promise<ToolResult[]> {
    // Parallel execution of tools
    const results = await Promise.all(
      toolConfigs.map(config => this.runTool(page, config))
    );

    return results;
  }

  private async runTool(
    page: Page,
    config: ToolConfig
  ): Promise<ToolResult> {
    const tool = this.tools.get(config.name);
    if (!tool) {
      throw new Error(`Tool ${config.name} not found`);
    }

    return await tool.run(page, config.options);
  }
}
```

```typescript
// apps/tool-server/src/server.ts
export class ToolServer {
  private tools: Map<string, TestingTool> = new Map();

  async start(port: number): Promise<void> {
    // Register available tools
    await this.registerTools();

    // Start HTTP server
    const server = express();
    server.post('/run/:tool', this.handleToolRequest.bind(this));
    server.listen(port);
  }

  private async handleToolRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    const { tool } = req.params;
    const { pageData, options } = req.body;

    const toolInstance = this.tools.get(tool);
    if (!toolInstance) {
      res.status(404).json({ error: 'Tool not found' });
      return;
    }

    // Run tool on provided page data
    const result = await toolInstance.run(pageData, options);
    res.json(result);
  }
}
```

```typescript
// packages/testaro/src/distributed-executor.ts
export class DistributedExecutor {
  private toolServers: Map<string, string> = new Map();

  async runTools(
    page: Page,
    toolConfigs: ToolConfig[]
  ): Promise<ToolResult[]> {
    // Distribute tools across servers
    const serverAssignments = this.assignToolsToServers(toolConfigs);

    // Execute tools in parallel
    const results = await Promise.all(
      serverAssignments.map(assignment =>
        this.executeOnServer(assignment.server, assignment.tools, page)
      )
    );

    return results.flat();
  }

  private async executeOnServer(
    server: string,
    tools: ToolConfig[],
    page: Page
  ): Promise<ToolResult[]> {
    // Send page data and tool configs to server
    const response = await fetch(`${server}/run`, {
      method: 'POST',
      body: JSON.stringify({ tools, pageData: await page.content() })
    });

    return await response.json();
  }
}
```

```typescript
// packages/custom-tools/customer-a-rules/src/index.ts
export class CustomerARulesTool implements TestingTool {
  async run(page: Page, options: ToolOptions): Promise<ToolResult> {
    // Customer-specific rule implementations
    const violations = await this.checkCustomRules(page, options.rules);

    return {
      violations,
      passes: [],
      incomplete: [],
      inapplicable: []
    };
  }

  private async checkCustomRules(
    page: Page,
    rules: string[]
  ): Promise<Violation[]> {
    // Implement customer-specific business rules
    const results: Violation[] = [];

    for (const rule of rules) {
      const violations = await this.checkRule(page, rule);
      results.push(...violations);
    }

    return results;
  }
}
```

---

## User comment about Turborepo

I am beginning to doubt the wisdom of using Turborepo in a rearchitected project, because in another monorepo Turborepo is severely complicating my effort to tailor test and check output summaries to optimize the experience of the person who reads them.

---

## Cursor reply about Turborepo

That’s a reasonable doubt. If bespoke, human-friendly summaries are a priority, Turborepo’s log grouping/caching model can get in your way. You have three solid paths:

- Prefer simplicity: pnpm workspaces + custom orchestrator
  - Write a small Node runner (one process) that:
    - Selects packages (by tags/globs), runs tasks with controlled concurrency
    - Captures stdout/stderr per task to files and JSON
    - Aggregates a final summary (Markdown/HTML/JSON) exactly as you want
  - Parallelize in CI with a matrix over packages; no Turborepo required
  - Keep caching at the tool level (e.g., esbuild/tsup/vitest/playwright caches) to avoid cross-task cache complexity

- Swap orchestration tool
  - Lage: lightweight, good parallelism, JSON reporter hooks; easier to bend logs
  - Moonrepo: fast, clear reporters and JSON output; flexible pipelines
  - Nx: powerful graph and caching, with multiple reporters and JSON output; consider only if you want its broader dev‑platform features (generators, project graph, affected logic)

- Keep Turbo, but decouple the summary
  - Run tasks with Turbo for speed, but tee each package’s reporter to per-task JSON files
  - Post-process only those JSON artifacts to build your curated summary (ignore Turbo’s console output)
  - Use package-level reporters (Vitest/Playwright/ESLint/Biome) as the source of truth

Recommendation for your case

- Use pnpm workspaces + a tiny custom runner (and/or a CI matrix) so you fully own output format and ordering, and avoid Turbo’s abstractions entirely. Add per-tool reporters that emit JSON and let a single summarizer assemble exactly the view you want. You can introduce a heavier orchestrator later if you need build graph/caching beyond what tools already provide.

If you want, I can sketch the runner’s interface (inputs/filters/concurrency) and the summary artifact format so it slots cleanly into your validation flow and UI.

## Converting tools from Playwright to Playwright Test

### Axe example

```typescript
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import { chromium } from 'playwright';

export async function runAxeScan(url: string): Promise<AxeResults | { error: string }> {
  if (!url) {
    return { error: 'URL is required' };
  }
  let browser: import('playwright').Browser | undefined;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const axeBuilder = new AxeBuilder({ page });
    const results = await axeBuilder
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    return results;
  } catch (error) {
    if (error instanceof Error) {
      return { error: `An error occurred: ${error.message}` };
    }
    return { error: 'An unknown error occurred' };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

```tsx
'use server';

import { runAxeScan } from '@/app/(custom-routes)/test/util';
import Header from '@/components/Header/Header';

export default async function AxeScanResults({
  searchParams,
}: {
  searchParams: Promise<{ targetURL: string }>;
}) {
  const params = await searchParams;
  const { targetURL } = params;
  const results = await runAxeScan(targetURL);
  if ('error' in results) {
    return (
      <div className="flex flex-col min-h-screen p-4 items-center">
        <h1 className="text-2xl font-bold mb-4">Accessibility Scan Error</h1>
        <p className="text-red-500">
          Could not scan {targetURL}: {results.error}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen p-4">
      <Header />
      <main className="max-w-3xl ml-9">
        <h1 className="text-2xl font-bold mb-4">Accessibility scan results</h1>
        <p className="mb-4">
          Results for:{' '}
          <a href={targetURL} className="text-blue-500 hover:underline">
            {targetURL}
          </a>
        </p>
        <div className="w-full max-w-4xl mt-4">
          <h2 className="text-xl font-bold">Violations: ({results.violations.length})</h2>
          {results.violations.length === 0 ? (
            <p>No violations found. Great job!</p>
          ) : (
            <ul className="list-disc pl-5">
              {results.violations.map((violation) => (
                <li key={violation.id} className="mt-2">
                  <strong>{violation.id}</strong> ({violation.impact}): {violation.help}
                  <p className="text-sm mt-1">{violation.description}</p>
                  <ul className="list-disc pl-5 mt-1">
                    {violation.nodes.map((node, index) => (
                      <li key={`${node.html}-${index}`}>
                        <p className="font-mono text-sm bg-gray-100 p-1 rounded">{node.html}</p>
                        <p className="text-xs">{node.failureSummary}</p>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={violation.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Learn more
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-full max-w-4xl mt-6">
          <h2 className="text-xl font-bold">Incomplete: ({results.incomplete.length})</h2>
        </div>

        <div className="w-full max-w-4xl mt-6">
          <h2 className="text-xl font-bold">Passes: ({results.passes.length})</h2>
        </div>
      </main>
    </div>
  );
}
```

## Databases

## Introduction

This is a guide to the use of databases in Team Spaces.

Team Spaces deployed on CAP can be equipped with PostgreSQL databases. In principle, a Team Space can leverage other database management systems, too, but CAP makes PostgreSQL easier than any other solution, so this guide covers only PostgreSQL.

## Do you need it?

If you want your application to create, modify, and delete data that persist across deployments, then the application needs persistent storage, and a PostgreSQL database can provide that.

## Limitations

CAP protects the databases of deployed applications from access by anything other than those deployments. Thus, your local development server and any preview deployments have no access to the database of your deployed application. Each environment requires its own database.

## Database creation

### Set environment variables

Here are examples of how the database-related environment variables can be defined.

Add to `apps/web/.env.local`:

```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=spacedb
PGUSER=localuser
PGPASSWORD=Unguessable29054
```

Add to `apps/web/.env.production`:

```bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=space-example-db
PGDATABASE_PREVIEW=previews-space-example-db
PGUSER=cap-space-example-123456789@cap-dev-gcp-appidentity.iam
PGUSER_PREVIEW=cap-previews-123456789@cap-dev-gcp-appidentity.iam
```

Add to (or create as) `apps/web/instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.CAP_APPLICATION === 'previews') {
    process.env.PGUSER = 'cap-previews-123456789@cap-dev-gcp-appidentity.iam';
    process.env.PGDATABASE = 'previews-space-example';
  }
}
```

A password is required only for the local database. CAP requires no password, because it allows only services of the associated application to connect to any database.

### Option 1: Independent environments

It is possible to make the databases of different environments completely independent. A straightforward strategy is to equip your application with the ability to create and modify a PostgreSQL database, by making `postgres` a package dependency:

```json
"dependencies": {
  "postgres": "3.4.7"
}
```

That gives your application the ability to use `sql` commands to manipulate a PostgreSQL database:

```typescript
import postgres from 'postgres';
const sql = postgres();
```

Example of using `sql`:

```typescript
const testCases = await sql`select * from testcases where testplan = 'md'`;
```

### Option 2: Migration among environments

Alternatively, you can do database development in one environment and migrate the database from that environment to the other two environments so they begin with the same schema and the same data.

If you start by developing the database locally, you can set up your local host to use the `psql` command-line client interface.  Here is an example setup for a MacOS host:

#### Create a user and a database

```bash
brew install postgresql@18
psql-18
postgres=> create user localuser with createdb password 'unguessable';
postgres=> create database spacedb owner localuser;
\q
```

#### Set environment variables for migration

Add to `~/.bash_profile`:

```bash
# PostgreSQL
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=spacedb
export PGUSER=localuser
export PGPASSWORD=Unguessable29054
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
```

#### Populate the database

```sql
psql-18
spacedb=> create table meds (id serial primary key, generic_name text not null);
spacedb=> insert into examples (id, generic_name) values (default, 'aspirin');
\q
```

#### Dump the database

Create files describing the database schema and data:

```bash
mkdir apps/web/db-dumps
pg_dump-18 --if-exists -csOd spacedb -f apps/web/db-dumps/schema.sql
pg_dump-18 --inserts -aOd spacedb -f apps/web/db-dumps/data.sql
```

You can find the explanations of the above options in the [PostgreSQL documentation](https://www.postgresql.org/docs/18/app-pgdump.html).

#### Migrate the database

Now the database dump files are in the `apps/web/db-dumps` directory. The application in a preview or deployment environment can repopulate its own database from those files, once that database exists.

The [CAP user interface](https://cap-ui.prod.platform.cvshealth.com/) allows adding a database to any CAP application. You can add one for your application. Every preview of your application is a service of the CAP `previews` application, so the database for your previews must belong to `previews`, which belongs to the `web-core` team. Getting a database for your Team Space added to the `previews` application requires an [XP service request](https://ycc.enterprise.slack.com/archives/C08ECQH6BT7).

Once your two non-local databases exist, your application can populate its database. Here is an example:

```tsx
import * as fs from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
const sql = postgres();
const schema = await fs.readFile(
  path.join(__dirname, '../../../db-dumps/schema.sql'),
  'utf8',
);
const data = await fs.readFile(
  path.join(__dirname, '../../../db-dumps/data.sql'),
  'utf8',
);
await sql.unsafe(schema);
await sql.unsafe(data);
```

## Database testing

### Mocking

Normally, unit tests that depend on a database mock the database.

To mock the database, create a utility function that makes any `SELECT` statement executed by `sql` return a particular array of rows. The subsequent tests can then check for the behaviors that should occur after an `sql` `SELECT` statement is executed.

Here is a database-mocking function:

```tsx
import postgres, { type Row, type RowList, type Statement } from 'postgres';
import { type Mock, vi } from 'vitest';

type MockRowList = Row[] & Omit<RowList<Row[]>, keyof Row[]>;
type MockedPostgres = typeof postgres & {
  __setMockSql: (fn: Mock<() => Promise<RowList<Row[]>>>) => void;
};

/**
 * Mocks the resolved value of the Promise returned by the sql function.
 * The argument is an array of row-like objects, i.e. objects with column names of a table as keys.
 */
export function mockSqlResolvedValue(value: Record<string, unknown>[]) {
  const mockStatement = {} as Statement;
  const result: MockRowList = Object.assign(value, {
    count: value.length,
    command: 'SELECT',
    columns: [],
    statement: mockStatement,
    state: 'done',
  }) as unknown as RowList<Row[]>;
  (postgres as MockedPostgres).__setMockSql(vi.fn().mockResolvedValue(result));
}
```

To make this function intercept any `SELECT` statements in unit tests, add to `apps/web/setupTests.ts`:

```typescript
import { afterEach, beforeEach, type Mock, vi } from 'vitest';
import path from 'node:path';

let mockSql = vi.fn();
vi.mock('postgres', () => {
  const mockPostgres = () => mockSql;
  return {
    default: Object.assign(mockPostgres, {
      __setMockSql: (fn: Mock) => {
        mockSql = fn;
      },
    }),
  };
});

beforeEach(() => {
  mockSql = vi.fn();
});

afterEach(() => {
  mockSql.mockReset();
});
```

### Testing

With mocking set up, your unit tests can expect particular results that you define, as in this example:

```tsx
import { mockSqlResolvedValue } from '@/app/test/util';

describe('Database queries', () => {
  it('should return the right data', async () => {
    mockSqlResolvedValue([
      {
        id: 'User 1',
        name: 'User 1',
        email: 'user1@example.com',
      },
      {
        id: 'User 2',
        name: 'User 2',
        email: 'user2@example.com',
      },
    ]);
    render(await ShowUsers());
    const email1 = screen.getByText('user1@example.com');
    expect(email1).toBeVisible();
  });
});
```

## Performance improvements

### Browser-Node iteration prevention

It is suspected that some Testaro tests are unnecessarily inefficient because they iterate across elements in a page, performing a browser operation on each and then returning a result for processing by Node. For example, in `lineHeight`:

```javascript
const all = await init(100, page, 'body *', {hasText: /[^\s]/});
// For each locator:
for (const loc of all.allLocs) {
  // Get whether its element violates the rule.
  const data = await loc.evaluate(el => {
    const styleDec = window.getComputedStyle(el);
    const {fontSize, lineHeight} = styleDec;
    return {
      fontSize: Number.parseFloat(fontSize),
      lineHeight: Number.parseFloat(lineHeight)
    };
  });
```

The inefficiency has necessitating sampling.

However, there is evidence that moving the processing of Playwright locators into the browser and returning the final result to Node could be 1 or 2 orders of magnitude faster and eliminate the need to sample, thereby improving speed and delivering accuracy and consistency.

One proposal for a rewrite of `lineHeight`, still doing sampling, was:

```javascript
// Reports a test.
exports.reporter = async (page, report) => {
  // Get data on elements with potentially invalid line heights.
  const data = await page.evaluate(() => {
    const instances = [];
    // Get all visible elements in the body with any text.
    const elements = Array
    .from(document.querySelectorAll('body *'))
    .filter(el => {
      const styleDec = window.getComputedStyle(el);
      const {display, visibility} = styleDec;
      return display !== 'none' && visibility !== 'hidden' && el.textContent.trim().length;
    });
    // Get a sample of them.
    const sampleIndexes = window.getSample(elements, 100);
    const sample = sampleIndexes.map(index => elements[index]);
    // For each element in the sample:
    sample.forEach(el => {
      const styleDec = window.getComputedStyle(el);
      const {lineHeight, fontSize} = styleDec;
      // If the line height is absolute:
      if (['px', 'pt'].some(unit => lineHeight.endsWith(unit))) {
        const lhValue = parseFloat(lineHeight);
        const fsValue = parseFloat(fontSize);
        // If the line height is less than 1.2 times the font size:
        if (fsValue > 0 && lhValue / fsValue < 1.2) {
          const box = el.getBoundingClientRect();
          // Add an instance to the result.
          instances.push({
            ruleID: 'lineHeight',
            what: 'Line height is less than 1.2 times the font size',
            ordinalSeverity: 2,
            tagName: el.tagName,
            id: el.id || '',
            location: {
              doc: 'dom',
              type: 'box',
              spec: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              }
            },
            excerpt: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 100)
          });
        }
      }
    });
    return {
      totals: [0, 0, instances.length, 0],
      instances
    };
  });

  // Add the result to the report.
  try {
    report.acts[report.actIndex].result.data = data;
  }
  catch(error) {
    console.log(`ERROR: Could not add result to report (${error.message})`);
  }
};
```

To reuse a sampling (or any other) function in multiple tests, it was proposed to store the function in a file and then inject it into the page as follows:

```javascript
const getSample = require(path.join(__dirname, 'procs/sample.js')).getSample;
const initScript = `window.getSample = ${getSample.toString()};`;
await browserContext.addInitScript(initScript);
```

## Version management for service

Proposals:

Prevent Future Conflicts
Option 1: Don't commit package-lock.json on the server (Recommended)

On the server, tell git to ignore local changes to package-lock.json:

```bash
# Assume package-lock.json is unchanged locally
git update-index --assume-unchanged package-lock.json
```

This prevents git from seeing the file as modified when npm update changes it.

Option 2: Exclude package-lock.json from version control

If you don't need package-lock.json in your repo (since you use * for all versions in package.json), add it to .gitignore:

```bash
echo "package-lock.json" >> .gitignore
git rm --cached package-lock.json
git commit -m "Stop tracking package-lock.json"
git push
```

Then on the server:

```bash
git pull
npm update  # Will create package-lock.json locally but git won't track it
```

Option 3: Proper deployment workflow (Best Practice)

On the server, use a deployment script instead of git pull:

```bash
#!/bin/bash
# deploy.sh

# Stash any local changes
git stash

# Fetch latest from origin
git fetch origin

# Reset to origin/main (discard all local changes)
git reset --hard origin/main

# Clean untracked files
git clean -fd

# Install dependencies
npm ci  # Use 'ci' instead of 'update' - it's deterministic

# Restart app
pm2 restart kilotest
```

Make it executable and use it:

```bash
chmod +x deploy.sh
./deploy.sh
```

Why This Happens

With "testaro": "*" in your package.json:

- Local dev: npm update locks to version X in package-lock.json
- Server: npm update locks to version Y (newer) in package-lock.json
- Git: Sees conflicting versions when you pull

Recommended Approach

Use exact versions to ensure consistency across environments:

```json
{
  "dependencies": {
    "dotenv": "^17.2.3",
    "testaro": "^2.1.0",
    "testilo": "^1.5.0"
  }
}
```

Then:

```bash
# Lock versions
npm install

# Commit the lock file
git add package.json package-lock.json
git commit -m "Lock dependency versions"
git push

# On server
git pull
npm ci  # Install exact versions from package-lock.json
pm2 restart kilotest
```

This ensures identical dependencies in both environments and prevents conflicts.

Automate Version Updates in package.json

You can use npm-check-updates (ncu) to automatically update version numbers in package.json:

Installation

```bash
npm install -g npm-check-updates
```

Usage

```bash
# Check what would be updated
ncu

# Update package.json with latest versions
ncu -u

# Install the new versions
npm install

# Commit and push
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

Automate with a Script
Add to your package.json:

```json
{
  "scripts": {
    "update-deps": "ncu -u && npm install && git add package.json package-lock.json"
  }
}
```

Then use:

```bash
npm run update-deps
git commit -m "chore: update dependencies"
git push
```

More Control with Target Versions
Instead of *, use caret ranges for automatic minor/patch updates:

```json
{
  "dependencies": {
    "dotenv": "^17.2.3",      // allows 17.x.x
    "testaro": "^2.1.0",      // allows 2.x.x
    "testilo": "^1.5.0"       // allows 1.x.x
  }
}
```

Then npm update will:

- Update to latest minor/patch versions within the range
- Update package-lock.json with exact versions
- Not change package.json unless you use ncu -u

Workflow

Local development:

```bash
# When you want to update dependencies
ncu -u          # Update package.json to latest versions
npm install     # Install and lock exact versions
npm test        # Verify everything works
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

Server deployment:

```bash
git pull                    # Gets updated package.json and package-lock.json
npm ci                      # Installs exact locked versions
pm2 restart kilotest
```

Alternative: Use npm's Built-in Commands

For major version updates with interactive prompts:

```bash
# Check outdated packages
npm outdated

# Update interactively (choose which to update)
npx npm-check -u

# Or update specific packages
npm install testaro@latest
npm install testilo@latest

# Commit the changes
git add package.json package-lock.json
git commit -m "chore: update testaro and testilo"
git push
```

Pre-commit Hook (Optional)
Ensure package-lock.json is always in sync:

```bash
# .husky/pre-commit or .git/hooks/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -q "package.json"; then
  if ! git diff --cached --name-only | grep -q "package-lock.json"; then
    echo "Error: package.json changed but package-lock.json didn't"
    echo "Run: npm install"
    exit 1
  fi
fi
```

Recommended Setup

1. Change * to ^ ranges in package.json
2. Install npm-check-updates globally: npm i -g npm-check-updates
3. Add update script to package.json
4. Use npm ci on server (never npm update or npm install)

This gives you:

✅ Automatic patch/minor updates with npm update
✅ Controlled major updates with ncu -u
✅ Cross-environment consistency via package-lock.json
✅ No git conflicts

Claude Sonnet 4.5 • 1x

## Cleanup synchronization

Claude Sonnet 4.5 recommendation to handle already-closed error messages on server (but not the local host) after end of a job:

The issue is that forceKillBrowsers() is killing the browser processes immediately, but the async browserClose() calls in the signal handlers are still trying to close already-dead browsers, causing repeated errors.

Solution: Coordinate Async and Sync Cleanup
Replace the cleanup handlers in run.js:

```javascript
// CLEANUP HANDLERS

// Track cleanup state.
let cleanupInProgress = false;
let forceKillScheduled = false;

// Force kills all Playwright browser processes synchronously.
const forceKillBrowsers = () => {
  if (cleanupInProgress) {
    return;
  }
  cleanupInProgress = true;

  const {execSync} = require('child_process');
  try {
    // Kill Chromium headless shell processes.
    execSync('pkill -9 -f "chromium_headless_shell.*headless_shell"', {stdio: 'ignore'});
  }
  catch(error) {
    // Ignore errors - processes may not exist.
  }
};

// Graceful cleanup with timeout fallback.
const gracefulCleanup = async (timeoutMs = 2000) => {
  if (forceKillScheduled) {
    return;
  }
  forceKillScheduled = true;

  // Try graceful close with timeout.
  const closePromise = browserClose();
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeoutMs));

  await Promise.race([closePromise, timeoutPromise]);

  // Force kill any remaining processes.
  forceKillBrowsers();
};

// Synchronous cleanup on process exit (last resort).
process.on('exit', () => {
  if (!cleanupInProgress) {
    forceKillBrowsers();
  }
});

// Graceful cleanup on SIGINT (Ctrl+C).
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  await gracefulCleanup();
  process.exit(130);
});

// Graceful cleanup on SIGTERM.
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...');
  await gracefulCleanup();
  process.exit(143);
});

// Cleanup on uncaught exceptions.
process.on('uncaughtException', async error => {
  console.error('Uncaught exception:', error);
  await gracefulCleanup(1000);
  process.exit(1);
});
```

And in `doActs`, replace the cleanup:

```javascript
  console.log('Acts completed');
  // If standardization is required:
  if (['also', 'only'].includes(standard)) {
    // ... existing standardization code ...
  }
  // Close the browser gracefully.
  await gracefulCleanup();
  // Delete the temporary report file.
  await fs.rm(reportPath, {force: true});
  return report;
```

Key changes:

gracefulCleanup(): Attempts async browserClose() but races it against a timeout, then force-kills
Guard flags: Prevent multiple simultaneous cleanup attempts that cause the error messages
Timeout: Gives browserClose 2 seconds to complete before forcing kill
No redundant calls: Only gracefulCleanup() calls both browserClose() and forceKillBrowsers()
process.on('exit') as fallback: Only runs if other cleanup didn't complete
This approach:

Tries graceful closure first (avoiding the errors)
Falls back to force-kill after timeout
Prevents the async cleanup from running after force-kill
Works consistently on both macOS and Ubuntu

The above recommendation seems complex. Meanwhile the error message has been suppressed on the basis that context closure is not necessarily an error.

## Heap memory exhaustion

Exhaustion of heap memory occurred when PNG images were added to reports by the `shoot0` and `shoot1` tests. This issue was resolved with the storage of PNG images as buffers in temporary files. A recommendation generated by Claude Sonnet 4.5 was to add a safety net to `doTestAct` to remove any very large properties from the report. This has not been implemented yet, partly out of concern that it might hide defects that create unduly large properties, inhibiting the rectification of such defects. The recommended code changes were:

```javascript
// ...existing code...

// Remove oversized properties from report to prevent serialization failures.
const sanitizeReport = report => {
  const MAX_PROPERTY_SIZE = 10 * 1024 * 1024; // 10MB threshold.

  for (const act of report.acts) {
    if (act.result) {
      for (const [key, value] of Object.entries(act.result)) {
        if (value && typeof value === 'object') {
          const size = JSON.stringify(value).length;
          if (size > MAX_PROPERTY_SIZE) {
            console.log(
              `WARNING: Removing oversized property '${key}' from ${act.which} result (${Math.round(size / 1024 / 1024)}MB)`
            );
            delete act.result[key];
          }
        }
      }
    }
  }
};

const doTestAct = async () => {
  // ...existing code...

  try {
    const actReport = await require(`../tests/${which}`).reporter(page, report, actIndex, 65);
    act.data = actReport.data;
    act.result = actReport.result;

    if (act.data && act.data.prevented) {
      report.jobData.preventions[which] = act.data.error;
    }

    await browserClose();

    // Sanitize report before serialization.
    sanitizeReport(report);

    const reportJSON = JSON.stringify(report);
    await fs.writeFile(reportPath, reportJSON);
    process.send('Act completed');
  }
  // ...existing code...
};
```

## Elapsed times

One example of the elapsed times (in seconds) for tool execution on a relatively complex and defect-rich page:

```json
"toolTimes": {
  "testaro": 132,
  "ibm": 25,
  "alfa": 13,
  "qualWeb": 13,
  "aslint": 7,
  "wax": 7,
  "axe": 6,
  "ed11y": 5,
  "nuVal": 4,
  "htmlcs": 3
},
```

The total is 215 seconds. The total elapsed time of the job was 318 seconds. The 103-second difference was consumed mainly by standardization.

Standardization and some Testaro tests are suspected of being inefficient in part by alternating many times between Node.js and the browser environment and partly by executing `getComputedStyle` many times.

The Testaro rule tests had the following elapsed times:

```json
"ruleTestTimes": {
  "lineHeight": 22,
  "allCaps": 9,
  "focInd": 8,
  "miniText": 7,
  "focAll": 7,
  "hovInd": 7,
  "focOp": 6,
  "focVis": 6,
  "opFoc": 6,
  "allSlanted": 5,
  "targetSmall": 4,
  "zIndex": 4,
  "distortion": 3,
  "linkAmb": 3,
  "targetTiny": 3,
  "shoot1": 3,
  "shoot0": 2,
  "linkUl": 2,
  "adbID": 1,
  "imageLink": 1,
  "hover": 1,
  "tabNav": 1,
  "allHidden": 0,
  "altScheme": 0,
  "dupAtt": 0,
  "autocomplete": 0,
  "bulk": 0,
  "captionLoc": 0,
  "datalistRef": 0,
  "docType": 0,
  "embAc": 0,
  "headEl": 0,
  "headingAmb": 0,
  "hr": 0,
  "labClash": 0,
  "legendLoc": 0,
  "linkExt": 0,
  "linkOldAtt": 0,
  "linkTitle": 0,
  "linkTo": 0,
  "nonTable": 0,
  "optRoleSel": 0,
  "phOnly": 0,
  "pseudoP": 0,
  "radioSet": 0,
  "role": 0,
  "secHeading": 0,
  "styleDiff": 0,
  "textSem": 0,
  "titledEl": 0,
  "buttonMenu": 0
},
```

## Element identification

Suggestions by GPT-5.1 about a strategy for cross-tool element identification:

You’re pointing at exactly the right abstraction: **“element identity across tools”** is a harder problem than “which XPath generator is best”, and it probably deserves its own design.

Let me outline options briefly so you can decide how far to push XPath in [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0) right now.

---

### 1. Why a single identifier is fragile

Any _single_ indicator can fail:

- **XPath / CSS selector**
  - Breaks if DOM structure changes between tools or between runs.
  - Different generators produce different-but-equivalent strings.
- **Line/column**
  - Depends on exact source formatting; minification / templating alters it.
- **Box coordinates**
  - Vary with layout, responsive design, fonts, zoom, user settings.
- **Text content**
  - Collisions (same text in many places), localization, dynamic content.
- **Outer/innerHTML**
  - Expensive to compare; small, unrelated changes break equality.

So, treating “XPath strings are equal” as _the_ notion of identity is brittle, especially across heterogeneous tools.

---

### 2. A fingerprint-style approach

A more robust way is to treat each element as having a **feature vector** and define similarity across those, rather than equality of a single field.

Example feature set per element:

- **DOM path structure**
  - A normalized XPath or CSS path (even if different generators format slightly differently)
  - Depth, tag sequence (e.g. `html/body/div/p`)
- **DOM neighborhood**
  - Parent tag and its classes/id
  - Position among siblings (index, `nth-of-type`)
- **Attributes**
  - `id`, `class` list, `name`, `role`, ARIA attributes
- **Content**
  - Normalized text content (trimmed, collapsed whitespace, maybe truncated hash)
- **Geometry (optional)**
  - Bounding box (x, y, width, height) rounded to a sensible grid
- **Source anchors (optional)**
  - Line/column if available from a tool

Then, when correlating two reports, you’d compute some similarity score between elements from different tools based on:

- Exact matches where possible (`id`, normalized text if short and unique)
- High-weight soft matches (same parent path + same tag + close sibling index)
- Weaker signals (similar bounding boxes, overlapping text, etc.)

This gives you an **element matcher** whose job is: “Given element A from tool X and a page, find the best candidate(s) for that element in tool Y’s universe.”

XPath then becomes _one strong feature_ but not the only one.

---

### 3. What this implies for [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0) now

Given that direction, for [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0) specifically:

- It’s still useful to:
  - Generate a **reasonable, deterministic path** (your in-page XPath helper is fine).
  - Record **other cheap features** you already have in each rule:
    - tag name
    - `id`/`class`
    - trimmed text (maybe length-limited)
    - maybe a simple parent description

- You don’t need [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0)’s XPath to **bit-for-bit match** `playwright-dompath`’s output _if_ later you’ll have a correlation step that:
  - Can re-locate [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0)’s element on a fresh page using its own path/attributes.
  - Then, if needed, run that DOM node through `playwright-dompath` to obtain the canonical XPath for cross-tool IDs.

So you can:

1. For now, implement the **fast in-page XPath helper** for [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0) and treat it as an _internal_ identifier plus context.
2. Defer the question of **canonical cross-tool ID** to a dedicated “element correlation” layer that may:
   - Normalize XPaths/paths.
   - Use multiple signals, not just string equality.

---

### 4. Practical short-term guidance

Given your goal to move on with [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0):

- Don’t over-invest in perfectly mimicking `playwright-dompath` inside the page.
- Do:
  - Use your shared `addXPathScript` + `window.testaroXPath`.
  - Include some extra context in each [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0) instance (`tagName`, `id`, `class`, short text).
- Plan separately for a future **element-matching module** that consumes all tools’ outputs and decides “these instances refer to the same DOM element”.

That way, you get immediate performance and implementation wins in [testaro](cci:7://file:///Users/pool/Users/pool/Documents/Topics/work/testaro:0:0-0:0), without locking yourself into the fragile assumption that “XPath strings must match exactly across all tools.

## Sampling and performance

Refactoring Testaro tests to eliminate sampling of elements began in December 2025. Initial results suggest that refactoring decreases elapsed test times despite the fact that all applicable elements are examined rather than only a sample.

In a run by the Kilotest server on the [home page of the Open Source Collective](https://opencollective.com/opensource), with about 2700 visible elements,the elapsed times of Testaro tests were:

```json
"ruleTestTimes": {
  "allCaps": 11,
  "opFoc": 10,
  "allSlanted": 9,
  "hovInd": 9,
  "focOp": 8,
  "targetSmall": 7,
  "focAll": 7,
  "focVis": 6,
  "distortion": 5,
  "linkAmb": 5,
  "titledEl": 5,
  "zIndex": 5,
  "targetTiny": 4,
  "shoot1": 4,
  "linkTitle": 3,
  "hover": 3,
  "shoot0": 2,
  "adbID": 2,
  "linkUl": 2,
  "buttonMenu": 2,
  "focInd": 2,
  "tabNav": 2,
  "dupAtt": 0,
  "imageLink": 1,
  "labClash": 1,
  "allHidden": 0,
  "altScheme": 0,
  "autocomplete": 0,
  "bulk": 0,
  "captionLoc": 0,
  "datalistRef": 0,
  "docType": 0,
  "embAc": 0,
  "headEl": 0,
  "headingAmb": 0,
  "hr": 0,
  "legendLoc": 0,
  "lineHeight": 0,
  "linkExt": 0,
  "linkOldAtt": 0,
  "linkTo": 0,
  "miniText": 0,
  "nonTable": 0,
  "optRoleSel": 0,
  "phOnly": 0,
  "pseudoP": 0,
  "radioSet": 0,
  "role": 0,
  "secHeading": 0,
  "styleDiff": 0,
  "textSem": 0
}
```

All of the tests with elapsed times longer than 2 seconds were not yet refactored. Some of the refactored tests applied `checkVisibility` to all `body` descendant elements.

Credit for the speed improvement in refactored tests is apparently owed to the encapsulation of the entire test logic in a browser function, versus the repeated element-by-element execution of the same logic in Node.js with Playwright methods.

Evidence for this hypothesis is provided by the change in elapsed time after refactoring of the `focOp` and `opFoc` tests. These two tests consumed 18 seconds before the refactoring. The refactoring combined them into a single `focAndOp` test with functionality equivalent to both original tests. The refactored test on the same target consumed 2 seconds, even though it reported and itemized 223 violations.
