import type { ApiResponse, LoginData } from '../types/api.js'
import type { ClientOptions, Session } from '../types/client.js'
import type { SignParams } from '../types/sign.js'
import type { SyncFromServerData, SyncFromServerDataRaw } from '../types/sync.js'

import {
  APP_VER,
  DEFAULT_DEVICE_MODEL,
  FULL_SYNC_WINDOW_SECONDS,
  REGION_HOSTS,
  USER_AGENT,
} from '../constants/api.js'
import { FitDaysApiError } from '../errors/api-error.js'
import { hashPassword, newClientId, newRequestId } from '../utils/crypto.js'
import { parseSyncFromServerData } from '../utils/parse-sync.js'
import { buildSign } from '../utils/sign.js'

export class FitDaysClient {
  public baseUrl: string
  public readonly clientId: string
  public readonly country: string
  public readonly deviceModel: string
  public readonly language: string
  public session: null | Session = null

  private readonly fetchImpl: typeof fetch

  constructor(opts: ClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? REGION_HOSTS[opts.region ?? 'us']).replace(/\/$/, '')
    this.country = opts.country ?? 'US'
    this.language = opts.language ?? 'en'
    this.deviceModel = opts.deviceModel ?? DEFAULT_DEVICE_MODEL
    this.clientId = opts.clientId ?? newClientId()
    this.fetchImpl = opts.fetchImpl ?? fetch
  }

  public login = async (email: string, password: string): Promise<Session> => {
    const res = await this.request<LoginData>('api/users/login', {
      email,
      password: hashPassword(password),
    })
    const data = res.data
    const token = data.token ?? (data.account as undefined | { token?: string })?.token
    const uid = data.account?.uid ?? (data as { uid?: number }).uid
    if (!token || uid === undefined) {
      throw new FitDaysApiError(res.code, res, 'Login response missing token or uid')
    }
    this.session = { refreshToken: data.refresh_token, token, uid }
    return this.session
  }

  public request = async <T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> => {
    const { url } = this.buildSignedUrl(path)

    const res = await this.fetchImpl(url, {
      body: body !== undefined ? JSON.stringify(body) : '{}',
      headers: {
        'Accept-Encoding': 'deflate, gzip',
        'content-type': 'application/json;charset=UTF-8',
        'user-agent': USER_AGENT,
      },
      method: 'POST',
    })

    const text = await res.text()
    let parsed: ApiResponse<T>
    try {
      parsed = JSON.parse(text) as ApiResponse<T>
    } catch {
      throw new FitDaysApiError(res.status, text, `Non-JSON response: ${text.slice(0, 200)}`)
    }

    if (parsed.code === 302 && (parsed.data as { domain?: string })?.domain) {
      this.baseUrl = (parsed.data as { domain: string }).domain.replace(/\/$/, '')
      return this.request<T>(path, body)
    }

    if (parsed.code !== 0 && parsed.code !== 200) {
      throw new FitDaysApiError(parsed.code, parsed, parsed.msg ?? 'FitDays API error')
    }

    return parsed
  }

  /** Convenience: sync the last ~6 years of data. */
  public syncAll = async (): Promise<ApiResponse<SyncFromServerData>> => {
    const now = Math.floor(Date.now() / 1000)
    return this.syncFromServer({ endTime: now - FULL_SYNC_WINDOW_SECONDS, startTime: now })
  }

  /**
   * Sync data from the server. By API convention `startTime` is the NEWEST
   * cutoff and `endTime` is the OLDEST — both in unix seconds.
   */
  public syncFromServer = async (opts: { endTime: number, startTime: number }): Promise<ApiResponse<SyncFromServerData>> => {
    if (!this.session) throw new Error('Not logged in: call login() first or assign client.session')
    const raw = await this.request<SyncFromServerDataRaw>('api/sync/syncFromServer', {
      end_time: opts.endTime,
      start_time: opts.startTime,
    })
    return { ...raw, data: parseSyncFromServerData(raw.data) }
  }

  /**
   * Build the URL with all signed query parameters: each signing key appears
   * once, followed by `sign`, and finally `capp_ver` (which is intentionally
   * outside the signature).
   */
  private buildSignedUrl = (path: string): { signParams: SignParams, url: string } => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const token = this.session?.token ?? ''
    const uid = this.session ? String(this.session.uid) : '0'

    const signParams: SignParams = {
      app_ver: APP_VER,
      client_id: this.clientId,
      country: this.country,
      device_model: this.deviceModel,
      language: this.language,
      os_type: '0',
      request_id: newRequestId(),
      source: '0',
      timestamp,
      token,
      uid,
    }

    const sign = buildSign(signParams)

    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(signParams)) qs.append(k, v)
    qs.append('sign', sign)
    qs.append('capp_ver', APP_VER)

    const sep = path.startsWith('/') ? '' : '/'
    return { signParams, url: `${this.baseUrl}${sep}${path}?${qs.toString()}` }
  }
}
