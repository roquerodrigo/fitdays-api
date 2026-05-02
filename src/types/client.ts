export type ClientOptions = {
  baseUrl?: string
  clientId?: string
  country?: string
  deviceModel?: string
  fetchImpl?: typeof fetch
  language?: string
  region?: Region
}

export type Region = 'cn' | 'eu' | 'us'

export type Session = {
  refreshToken?: string
  token: string
  uid: number
}
