export type ApiResponse<T> = {
  code: number
  data: T
  msg?: string
}

export type LoginData = {
  [k: string]: unknown
  account?: { [k: string]: unknown, uid: number }
  refresh_token?: string
  token: string
}
