import type { SignParams } from '../types/sign.js'

import { SIGN_SECRET } from '../constants/sign.js'
import { md5Hex } from './crypto.js'
import { javaUrlEncode } from './encode.js'

/**
 * Build the `sign` query parameter the API expects:
 *  1. take the 11 signing params (alphabetical order)
 *  2. join as `k1=v1&k2=v2&...` (no trailing &)
 *  3. append the literal `SIGN_SECRET`
 *  4. URLEncode the whole thing (form-urlencoded; space -> "+")
 *  5. MD5 -> lowercase hex
 */
export const buildSign = (params: SignParams): string => {
  const keys = Object.keys(params).sort() as (keyof SignParams)[]
  const raw = keys.map((k) => `${k}=${params[k]}`).join('&')
  return md5Hex(javaUrlEncode(raw + SIGN_SECRET))
}
