# fitdays-api

Unofficial TypeScript SDK for the FitDays / Icomon smart-scale cloud API
(email/phone login + `syncFromServer` data sync). Published to npm as
`fitdays-api`. Public repo, MIT-licensed.

For code style, naming, typing, commit and release conventions, **read
`CODE_STYLE.md` first** — this file only covers orientation: what the
project is, how it's laid out, and how to build/test/lint it.

## What it does

`FitDaysClient` logs in (email or phone) and pulls body-composition sync
data from FitDays' servers (`us` / `eu` / `cn` regions). Responses are fully
typed, including the `ext_data` field on weight measurements, which the
server returns as a JSON string and the SDK auto-parses into
`WeightExtData`.

## Layout

`src/fitdays-api.ts` is the single public entry point — only what it
re-exports is public API; everything else (client, utils, types, constants,
errors) can change shape freely. `src/scripts/` (`test-sync.ts`,
`verify-sign.ts`) are manual CLI checks, not published.

## Commands

| command | what it does |
| --- | --- |
| `npm run build` | `tsc` → `dist/` (dev build, includes scripts/tests) |
| `npm run build:publish` | clean `tsc -p tsconfig.build.json` build — what actually ships (excludes scripts/tests) |
| `npm run lint` | ESLint with `--fix` (typescript-eslint + `@stylistic` + `perfectionist`) |
| `npm test` | `tsc` then `node --test --experimental-test-coverage` on `dist/tests/*.test.js`; **fails below 90% line/function or 80% branch coverage** on `client/`, `utils/`, `errors/`, `constants/` |
| `npm run verify-sign` | checks the request-signing algorithm against a known vector |
| `npm run test:sync` | real login + full sync against the live FitDays server; needs `FITDAYS_EMAIL` / `FITDAYS_PASSWORD` in a local `.env` (gitignored); writes `sync-response.json` |

Run `npm run lint && npm test` before committing — both mirror the checks
release-please/publish rely on.

## Non-obvious things

- **Node ≥ 22 required**, ESM-only (`"type": "module"`), uses the built-in
  `fetch`. No CommonJS build.
- **`npm test` compiles first** — it runs against `dist/`, not `src/`.
  Running `node --test` directly on stale `dist/` output gives misleading
  results; always go through `npm test`.
- **`syncFromServer({ startTime, endTime })` has server-flipped bounds**:
  `startTime` is the *upper* (most recent) bound, `endTime` is the *lower*
  (oldest) bound, both unix-seconds. `syncAll()` wraps this correctly for
  the full ~6-year window (`FULL_SYNC_WINDOW_SECONDS`).
- Relative imports **must** include the `.js` extension (NodeNext
  resolution) even though the source files are `.ts`.
- Test fixtures are captured-byte, no live network calls in the unit test
  suite — real-device/live-server testing only happens via
  `npm run test:sync`, which is not run in CI.
- **`ci.yml` gates lint, build and tests** on push to `main` and on every
  PR, by calling the shared reusables (`node-lint`, `node-build`,
  `node-test`) from `roquerodrigo/workflows`.
  The lint job runs `eslint` directly, *not* `npm run lint` — that script
  carries `--fix` and would pass on anything auto-fixable. Every job
  installs with `npm ci`, so a lockfile out of sync with `package.json`
  fails the build.
- Versioning and `CHANGELOG.md` are fully owned by `release-please`
  (Conventional Commits parsed from `main`). Don't hand-edit
  `package.json`'s `version`.
- **Publishing to npm is automated.** `release.yml` runs `release-please`
  (version bump + tag + GitHub release), then a `publish` job fires only when
  `release-created == 'true'` and pushes to npm via trusted publishing (OIDC,
  `id-token: write` — no stored registry token). The `workflow_run.event ==
  'push'` guard is what stops a green-CI PR from cutting a release.
  `prepack`/`prepublishOnly` build and verify the package before it ships.
