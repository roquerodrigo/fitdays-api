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
- **No CI workflow runs lint/tests on push or PR.** `.github/workflows/`
  only has `release.yml` (release-please, triggered on push to `main`) and
  `auto-assign.yml` (assigns @roquerodrigo to new PRs). Treat `npm run lint
  && npm test` as the only gate — nothing else will catch a broken change
  before merge.
- Versioning and `CHANGELOG.md` are fully owned by `release-please`
  (Conventional Commits parsed from `main`). Don't hand-edit
  `package.json`'s `version`.
- **No CI step publishes to npm.** `release.yml` only runs `release-please`
  (version bump + tag + GitHub release); someone still has to run
  `npm publish` locally afterward (`prepack`/`prepublishOnly` build and
  verify it). This has already drifted: as of this writing the npm registry
  only has `1.0.0` published even though `1.0.1`/`1.0.2` are tagged and in
  `CHANGELOG.md` — check `npm view fitdays-api version` against
  `package.json` before assuming a release shipped.
