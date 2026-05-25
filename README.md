# fitdays-api

[![npm](https://img.shields.io/npm/v/fitdays-api)](https://www.npmjs.com/package/fitdays-api)

Unofficial TypeScript SDK for the FitDays API.

Covers email/phone login and data sync (`syncFromServer`), with full typings for the response — including automatic JSON parsing of the `ext_data` field on weight measurements.

```ts
import { FitDaysClient } from 'fitdays-api'

const client = new FitDaysClient({ region: 'us' })
await client.login('foo@example.com', 'my-password')
const sync = await client.syncAll()
console.log(sync.data.weight_list[0].weight_kg)
```

---

## Contents

1. [Install & requirements](#install--requirements)
2. [Quick start](#quick-start)
3. [API — `FitDaysClient`](#api--fitdaysclient)
4. [Sync response types](#sync-response-types)
5. [Error handling](#error-handling)
6. [Recipes](#recipes)
7. [Project layout](#project-layout)
8. [Scripts](#scripts)
9. [Disclaimer](#disclaimer)

---

## Install & requirements

- **Node.js ≥ 22** (the SDK is pure ESM with `NodeNext` and uses the built-in `fetch`).
- TypeScript ≥ 5.5 (optional — works fine in plain JS too).

```sh
npm install
npm run build
```

---

## Quick start

```ts
import { FitDaysClient } from 'fitdays-api'

const client = new FitDaysClient({ region: 'us' })

// Login (the plaintext password is hashed internally)
const session = await client.login('foo@example.com', 'my-password')
console.log('uid:', session.uid)

// Pull ~6 years of data
const sync = await client.syncAll()
console.log(`${sync.data.weight_list.length} measurements`)

// Custom window (unix-seconds; startTime is the UPPER bound)
const now = Math.floor(Date.now() / 1000)
const week = await client.syncFromServer({
  endTime: now - 7 * 86400,
  startTime: now,
})
```

---

## API — `FitDaysClient`

### Constructor

```ts
new FitDaysClient(opts?: ClientOptions)
```

| option        | default                          | description                                                |
| ------------- | -------------------------------- | ---------------------------------------------------------- |
| `region`      | `'us'`                           | `'us'` \| `'eu'` \| `'cn'` — picks the API host            |
| `baseUrl`     | derived from `region`            | overrides the host (useful for tests or new hosts)         |
| `country`     | `'US'`                           | sent as the `country` query param                          |
| `language`    | `'en'`                           | sent as the `language` query param                         |
| `deviceModel` | `'AndroidSDKbuiltforarm64-6.0'`  | sent as the `device_model` query param                     |
| `clientId`    | generated (uppercase MD5 of UUID) | identifies the client "device"                            |
| `fetchImpl`   | `globalThis.fetch`               | inject for tests or to use `undici` / `node-fetch`         |

### Public properties

```
client.baseUrl       string — auto-updated on a 302 redirect
client.clientId      readonly string
client.country       readonly string
client.deviceModel   readonly string
client.language      readonly string
client.session       Session | null — populated by login
```

To "log in" without calling `login()` (e.g. reusing a saved token):

```
client.session = { token: '...', uid: 12345, refreshToken: '...' }
```

### Methods

```ts
interface FitDaysClient {
  login(email: string, password: string): Promise<Session>
  loginWithPhone(phone: string, password: string): Promise<Session>
  syncFromServer(opts: { endTime: number, startTime: number }): Promise<ApiResponse<SyncFromServerData>>
  syncAll(): Promise<ApiResponse<SyncFromServerData>>
  request<T>(path: string, body?: unknown): Promise<ApiResponse<T>>
}
```

Every method throws [`FitDaysApiError`](#error-handling) when the response carries an error code.

#### `request<T>(path, body)`

Low-level helper for any endpoint that uses the same signing scheme. It pulls the token and `client_id` from the current session automatically:

```
const res = await client.request<{ items: unknown[] }>('api/some/endpoint', { foo: 1 })
```

Handles `code: 302` redirects automatically (updates `client.baseUrl` and replays the request).

#### `syncFromServer({ endTime, startTime })`

Heads-up: by server convention, **`startTime` is the most-recent bound** and `endTime` is the oldest (both in unix-seconds). `syncAll()` is shorthand for `[now - ~6 years, now]`.

Each `weight_list[i].ext_data` is JSON-decoded into a typed object before it reaches you — no need to call `JSON.parse` yourself.

---

## Sync response types

```ts
import type {
  SyncFromServerData,
  WeightRecord,
  WeightExtData,
  HeightRecord,
  Device,
  BindDevice,
  AccountInfo,
  User,
} from 'fitdays-api'
```

| type                    | content                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `SyncFromServerData`    | root object with 13 lists + `account`                         |
| `AccountInfo`           | account record (uid, email, server_id, configs, …) + sub-users |
| `User`                  | sub-user (suid, nickname, sex, birthday, height, photo)       |
| `Device` / `BindDevice` | physical device and its account binding                       |
| `WeightRecord`          | one body-composition measurement                              |
| `WeightExtData`         | parsed shape of `ext_data` inside each `WeightRecord`         |
| `HeightRecord`          | one height measurement                                        |

Lists with too few observed samples stay typed as `Record<string, unknown>[]` (`RulerRecord`, `BalanceRecord`, `GravityRecord`, `ImpedanceRecord`, `HrRecord`, `SkipRecord`, `Product`). Once you capture a populated response, tighten them in `src/types/sync.ts`.

If you need the un-parsed shape, use `WeightRecordRaw` / `SyncFromServerDataRaw` (same fields, but `ext_data` stays as a `string`). The helpers `parseWeightRecord` and `parseSyncFromServerData` are exported as well.

---

## Error handling

`FitDaysApiError extends Error` is thrown when:

- The API returns a `code` other than `0` or `200`.
- The response body is not JSON.
- The server returned a redirect (`302`) without a `domain` field.
- A successful login response is missing `token` and `uid`.

```ts
import { FitDaysApiError } from 'fitdays-api'

try {
  await client.login(email, password)
} catch (err) {
  if (err instanceof FitDaysApiError) {
    console.error('code', err.code, 'response', err.response)
  } else {
    throw err
  }
}
```

---

## Recipes

### Reuse a saved session

```
const client = new FitDaysClient({ region: 'us' })
client.session = JSON.parse(await readFile('session.json', 'utf8'))
await client.syncAll()
```

### Filter recent, non-deleted measurements for the active user

```
const sync = await client.syncAll()
const activeUid = sync.data.account.active_suid
const meAndRecent = sync.data.weight_list
  .filter((w) => w.suid === activeUid && w.is_deleted === 0)
  .sort((a, b) => b.measured_time - a.measured_time)
```

### Custom `fetch` for request logging

```
const verboseFetch: typeof fetch = (input, init) => {
  console.log('→', input)
  return fetch(input, init)
}
const client = new FitDaysClient({ fetchImpl: verboseFetch })
```

---

## Project layout

```
src/
├── client/
│   └── fitdays-client.ts   FitDaysClient
├── constants/
│   ├── api.ts              APP_VER, REGION_HOSTS, FULL_SYNC_WINDOW_SECONDS, …
│   └── sign.ts             SIGN_SECRET, PASSWORD_SALT
├── errors/
│   └── api-error.ts        FitDaysApiError
├── scripts/
│   ├── test-sync.ts        run a real sync (reads .env)
│   └── verify-sign.ts      checks the signer against a known vector
├── tests/                  unit tests (node:test)
├── types/
│   ├── api.ts              ApiResponse, LoginData
│   ├── client.ts           Region, ClientOptions, Session
│   ├── sign.ts             SignParams
│   └── sync.ts             syncFromServer response types
├── utils/
│   ├── crypto.ts           md5Hex, hashPassword, newClientId, newRequestId
│   ├── encode.ts           javaUrlEncode
│   ├── parse-sync.ts       parseWeightRecord, parseSyncFromServerData
│   └── sign.ts             buildSign
└── fitdays-api.ts          entry point — re-exports the public API
```

---

## Scripts

| script                | what it does                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run build`       | compiles with `tsc` to `dist/`                                                                                |
| `npm run lint`        | ESLint (typescript-eslint + perfectionist + stylistic) with `--fix`                                          |
| `npm test`            | compiles + runs the native Node tests with coverage. Fails below 90% lines/funcs or 80% branches              |
| `npm run verify-sign` | checks the signer against a known vector                                                                      |
| `npm run test:sync`   | full login + sync against the real server (reads `FITDAYS_EMAIL` / `FITDAYS_PASSWORD` from `.env`); writes the response to `sync-response.json` |

To use `test:sync`, create a `.env` file (already in `.gitignore`):

```
FITDAYS_EMAIL=foo@example.com
FITDAYS_PASSWORD=my-password
```

---

## Disclaimer

This SDK is not affiliated with or endorsed by FitDays / Icomon. Use at your own risk and respect the service's ToS.
