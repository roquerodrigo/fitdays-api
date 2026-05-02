import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { FitDaysClient } from '../client/fitdays-client.js'
import { FitDaysApiError } from '../errors/api-error.js'

type MockResponse = { body?: unknown, status?: number, text?: string }

const mockFetch = (handler: (url: string, init?: RequestInit) => MockResponse): typeof fetch => {
  return (async (input: Request | string | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const out = handler(url, init)
    const text = out.text ?? JSON.stringify(out.body ?? {})
    return new Response(text, { status: out.status ?? 200 })
  }) as typeof fetch
}

const makeWeightRaw = (id: number) => ({
  adc: 0,
  adc_list: '',
  app_ver: '1.21.0',
  balance_data_id: '',
  bfa_type: 1,
  bfr: 0,
  bm: 0,
  bmi: 0,
  bmr: 0,
  bodyage: 0,
  created_at: '',
  data_calc_type: 0,
  data_id: 'd' + id,
  device_id: 'dev',
  electrode: 0,
  ext_data: JSON.stringify({ age: id }),
  gravity_data_id: '',
  hr: 0,
  id,
  imp_data_id: '',
  is_deleted: 0,
  kg_scale_division: 0,
  lb_scale_division: 0,
  measured_time: 0,
  pp: 0,
  rom: 0,
  rosm: 0,
  sfr: 0,
  source: 0,
  suid: 0,
  uid: 1,
  updated_at: '',
  uvi: 0,
  vwc: 0,
  weight_g: 0,
  weight_kg: 0,
  weight_lb: 0,
})

const emptyLists = {
  balance_list: [],
  bind_device: [],
  devices: [],
  gravity_list: [],
  height_list: [],
  hr_list: [],
  impedance_list: [],
  products: [],
  rulers_list: [],
  skip_list: [],
  users: [],
}

describe('FitDaysClient — constructor', () => {
  it('applies sane defaults', () => {
    const c = new FitDaysClient()
    assert.equal(c.country, 'US')
    assert.equal(c.language, 'en')
    assert.equal(c.deviceModel, 'AndroidSDKbuiltforarm64-6.0')
    assert.match(c.clientId, /^[0-9A-F]{32}$/)
    assert.equal(c.baseUrl, 'https://online-us.fitdays.cn')
    assert.equal(c.session, null)
  })

  it('honours overrides', () => {
    const c = new FitDaysClient({
      clientId: 'AAAA',
      country: 'BR',
      deviceModel: 'Pixel-13',
      language: 'pt-BR',
      region: 'eu',
    })
    assert.equal(c.clientId, 'AAAA')
    assert.equal(c.country, 'BR')
    assert.equal(c.language, 'pt-BR')
    assert.equal(c.deviceModel, 'Pixel-13')
    assert.equal(c.baseUrl, 'https://online-eu.fitdays.cn')
  })

  it('strips trailing slash from baseUrl', () => {
    const c = new FitDaysClient({ baseUrl: 'https://example.com/' })
    assert.equal(c.baseUrl, 'https://example.com')
  })
})

describe('FitDaysClient — login', () => {
  it('stores the session on success', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({
        body: { code: 0, data: { account: { uid: 42 }, refresh_token: 'r', token: 't' } },
      })),
    })
    const session = await c.login('a@b.com', 'pw')
    assert.deepEqual(session, { refreshToken: 'r', token: 't', uid: 42 })
    assert.equal(c.session, session)
  })

  it('throws FitDaysApiError when the server returns a non-zero code', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({ body: { code: 1001, data: null, msg: 'wrong password' } })),
    })
    await assert.rejects(() => c.login('a@b.com', 'pw'), (err: unknown) => {
      assert.ok(err instanceof FitDaysApiError)
      assert.equal((err as FitDaysApiError).code, 1001)
      assert.equal((err as Error).message, 'wrong password')
      return true
    })
  })

  it('throws when the success response is missing token/uid', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({ body: { code: 0, data: {} } })),
    })
    await assert.rejects(() => c.login('a@b.com', 'pw'), FitDaysApiError)
  })

  it('follows a 302 redirect to a new domain', async () => {
    let calls = 0
    const c = new FitDaysClient({
      fetchImpl: mockFetch((url) => {
        calls++
        if (calls === 1) {
          return { body: { code: 302, data: { domain: 'https://new.example.com/' } } }
        }
        assert.ok(url.startsWith('https://new.example.com'))
        return { body: { code: 0, data: { account: { uid: 1 }, token: 't' } } }
      }),
    })
    await c.login('a@b.com', 'pw')
    assert.equal(c.baseUrl, 'https://new.example.com')
    assert.equal(calls, 2)
  })

  it('throws on non-JSON response', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({ status: 500, text: '<html>oops</html>' })),
    })
    await assert.rejects(() => c.login('a@b.com', 'pw'), FitDaysApiError)
  })
})

describe('FitDaysClient — sync', () => {
  it('throws when not logged in', async () => {
    const c = new FitDaysClient()
    await assert.rejects(() => c.syncFromServer({ endTime: 0, startTime: 1 }), /Not logged in/)
  })

  it('parses weight_list[].ext_data automatically', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({
        body: {
          code: 0,
          data: {
            account: { uid: 1 },
            ...emptyLists,
            weight_list: [makeWeightRaw(1), makeWeightRaw(2)],
          },
        },
      })),
    })
    c.session = { token: 't', uid: 1 }

    const res = await c.syncFromServer({ endTime: 0, startTime: 1 })
    assert.equal(res.data.weight_list.length, 2)
    assert.equal(res.data.weight_list[0].ext_data.age, 1)
    assert.equal(res.data.weight_list[1].ext_data.age, 2)
  })

  it('syncAll requests a ~6-year window with start_time = now', async () => {
    let captured: unknown = null
    const c = new FitDaysClient({
      fetchImpl: mockFetch((_url, init) => {
        captured = JSON.parse(init?.body as string)
        return {
          body: { code: 0, data: { account: { uid: 1 }, ...emptyLists, weight_list: [] } },
        }
      }),
    })
    c.session = { token: 't', uid: 1 }
    await c.syncAll()

    const body = captured as { end_time: number, start_time: number }
    const now = Math.floor(Date.now() / 1000)
    assert.ok(Math.abs(body.start_time - now) < 5, 'start_time should be ≈ now')
    assert.equal(body.start_time - body.end_time, 186624000)
  })
})

describe('FitDaysClient — request', () => {
  it('signs the URL with all expected query params', async () => {
    let signedUrl = ''
    const c = new FitDaysClient({
      fetchImpl: mockFetch((url) => {
        signedUrl = url
        return { body: { code: 0, data: {} } }
      }),
    })

    await c.request('api/whatever')

    const u = new URL(signedUrl)
    for (const k of ['app_ver', 'client_id', 'country', 'device_model', 'language',
      'os_type', 'request_id', 'source', 'timestamp', 'token', 'uid', 'sign', 'capp_ver']) {
      assert.ok(u.searchParams.has(k), `missing ${k}`)
    }
    assert.equal(u.searchParams.get('app_ver'), '1.21.0')
    assert.equal(u.searchParams.get('capp_ver'), '1.21.0')
    assert.match(u.searchParams.get('sign')!, /^[0-9a-f]{32}$/)
  })

  it('accepts code 200 alongside code 0', async () => {
    const c = new FitDaysClient({
      fetchImpl: mockFetch(() => ({ body: { code: 200, data: { ok: true } } })),
    })
    const res = await c.request<{ ok: boolean }>('api/x')
    assert.equal(res.data.ok, true)
  })
})
