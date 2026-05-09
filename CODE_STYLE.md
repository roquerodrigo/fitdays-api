# Code Style Guide

Style conventions for the `fitdays-api` TypeScript SDK. Run `npm run lint`
before committing — it executes ESLint with `--fix`. `npm test` follows
(`tsc` + `node --test` with the 90 % coverage gate enforced by
`--test-coverage-lines=90`).

**Always read this file before adding or restructuring code.**

## Language

- Code is written in **English**: file names, type names, function names,
  variable names, object keys, identifier strings.
- The conversation language with the user can be Portuguese or anything else;
  what is committed to disk stays English.

## File organization

- **Source layout is `src/`.** Compiled output goes to `dist/` (gitignored).
- **One default export per file when it's a class or top-level function**;
  named exports otherwise.
- **Subdirectories group by concern**:
  - `constants/` — frozen constant tables (API URLs, sign salts).
  - `types/` — type-only modules; pure interface and `type` declarations.
  - `errors/` — custom error classes (one per file).
  - `utils/` — pure helper functions used across the public API.
  - `tests/` — unit tests, one file per module under test (`*.test.ts`).
- **Test files live next to their domain** (under `src/tests/`), not in a
  parallel `test/` tree, so the `tsc` compiler picks them up with the same
  config as production code. The `files` field in `package.json` excludes
  them from the published wheel.
- **Public surface is the single entry point** (`src/fitdays-api.ts` →
  built to `dist/fitdays-api.js`). Anything not re-exported from there is
  internal.

## Naming

- Public classes / interfaces / types are `PascalCase`: `FitdaysClient`,
  `SyncRecord`, `ApiResponse`.
- Functions and variables are `camelCase`.
- Module file names are `kebab-case`: `fitdays-api.ts`, `parse-sync.ts`,
  `api-error.ts`.
- Custom error classes end with `Error`: `ApiError`.
- Constants are `SCREAMING_SNAKE_CASE` when frozen tables, `camelCase`
  otherwise.

## Typing

**Strict TypeScript. No `any`.** `tsconfig.json` has `"strict": true`.

Banned: `any`, `Function` as a type, untyped object literals leaked to the
public API.

Required:

- `interface` for object shapes that may be extended; `type` for unions and
  aliases.
- `readonly` on collection fields that don't mutate after construction.
- Discriminated unions for error variants (e.g. `{ kind: 'ok' } | { kind: 'err', error: ApiError }`)
  rather than throwing inside utility functions.
- Always type return values explicitly on exported functions. Internal
  helpers can rely on inference.
- Type narrowing via `is`-predicates / `assert`-functions instead of casts.

The package ships its types via `"types": "dist/fitdays-api.d.ts"` in
`package.json`.

## Imports

- ESM only (`"type": "module"`). Always include the `.js` extension on
  relative imports — Node's NodeNext resolver requires it:

  ```ts
  import { signRequest } from './utils/sign.js'   // ✓
  import { signRequest } from './utils/sign'      // ✗ runtime resolution fails
  ```

- Type-only imports use `import type`:

  ```ts
  import type { SyncRecord } from './types/sync.js'
  ```

- `eslint-plugin-perfectionist` enforces import ordering; let `npm run lint`
  fix it instead of arranging by hand.

## Docstrings

- TSDoc comments on every exported symbol that's part of the public surface.
- Keep them short — a single sentence is usually enough. Describe the
  *contract* or the *why*, not the obvious implementation.
- Don't restate types — TypeScript already does that. Skip
  `@param`/`@returns` if the signature alone is self-explanatory.

## Comments

- Default to **no comments**. Add one only when the *why* is not obvious from
  the code: a hidden constraint, a workaround, an upstream-API quirk.
- Never describe *what* the code does — well-named identifiers handle that.
- **No section dividers** like `// --- Helpers ---`. If a file has so many
  sections that you feel the need for visual separators, split it into
  multiple files instead.

## Logging

- The SDK doesn't ship a logger. Surface diagnostics via thrown errors
  (carrying `cause` chains) or returned discriminated results, and let the
  caller plug in their own logging.
- Never `console.log` from library code in production paths. CLI test
  scripts under `src/scripts/` may use `console.log` for human output and
  are excluded from the published wheel.

## Error messages

- Format: `"Failed to <verb> <object>: <cause>"`. Keep them short and
  grep-able.
- Custom errors extend `Error` and end with `Error`: `ApiError`. Set
  `error.name` in the constructor so stack traces are readable.
- Carry the upstream cause via `new Error('...', { cause: original })`.
- Pre-validate inputs (sign salt length, payload shape) before opening a
  network call so user-facing errors point at the bad input.

## Public API surface

- Anything exported from `src/fitdays-api.ts` is the public contract.
  Renaming or removing those symbols is a `BREAKING CHANGE:`.
- Internal modules can change shape freely as long as the public re-exports
  keep working.

## Pre-commit hooks

`pre-commit` is recommended even for TypeScript projects. Add
`.pre-commit-config.yaml` invoking `npm run lint` and install once per clone:

```bash
pre-commit install
```

Skip it only on emergency `git commit --no-verify` and immediately re-run
`npm run lint`.

## Conventional commits

All commits follow [Conventional Commits](https://www.conventionalcommits.org/),
which `release-please` parses to bump `package.json` `version` and generate
`CHANGELOG.md`:

| Type | Meaning | Bump |
|---|---|---|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `perf` | Performance improvement | patch |
| `deps` | Dependency bump | patch |
| `docs` | Documentation only | none |
| `refactor` | Refactor without behavior change | none |
| `test` | Test-only change | none |
| `ci` | CI / tooling change | none |
| `chore` | Anything else (rarely) | none |

- Subject line: imperative mood, lowercase, no trailing period.
- Use scopes when useful: `feat(client): retry on 429 with backoff`.
- A `BREAKING CHANGE:` footer (or `!` after type) bumps the major version.

## Packaging

- `"type": "module"`. ESM only — no CommonJS dual-build.
- `"main"` and `"types"` point at `dist/fitdays-api.{js,d.ts}`. The
  `exports` map mirrors them. Don't bypass — keep all consumer entry
  points routed through the map.
- `"sideEffects": false` — bundlers can tree-shake the SDK aggressively.
- `"files"` excludes scripts and tests so they aren't published.
- `engines.node = ">=22.0.0"`. Don't bump without a `BREAKING CHANGE:`.

## Releasing

- `release-please` runs on `main` and opens a release-PR with the next
  version + `CHANGELOG.md`. Merging that PR triggers the publish job
  (`npm publish` via OIDC + npm Trusted Publisher — no token in repo
  secrets).
- Don't manually edit `package.json` `version` — release-please owns it.

## Testing

- Tests live in `src/tests/`. `npm test` compiles with `tsc` and runs them
  via `node --test --experimental-test-coverage`. The 90 % coverage gate
  on `dist/{client,utils,errors,constants}/**` is enforced by the test
  command.
- Captured-byte fixtures only — no network calls in CI. Real-device tests
  are gated behind an env var.

## Linting and verification

- ESLint flat-config in `eslint.config.mjs`: typescript-eslint recommended
  + `@stylistic` + `perfectionist` (import ordering). `npm run lint`
  applies fixes automatically.
- `tsc --noEmit` (via `npm test`'s `tsc` step) catches type errors.
- After every change run `npm run lint && npm test`. Both gates mirror CI.
