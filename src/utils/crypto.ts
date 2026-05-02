import { createHash, randomUUID } from 'node:crypto'

import { PASSWORD_SALT } from '../constants/sign.js'

export const md5Hex = (input: string): string =>
  createHash('md5').update(input, 'utf8').digest('hex')

/**
 * Hash a plaintext password the way the login endpoint expects it:
 * MD5 of (plain + salt), uppercased, then MD5 of that uppercase hex string.
 *
 * Note: the second MD5 must be fed the UPPERCASE hex of the first — feeding
 * the lowercase variant produces a different (and rejected) hash.
 */
export const hashPassword = (plaintext: string): string => {
  const inner = md5Hex(plaintext + PASSWORD_SALT).toUpperCase()
  return md5Hex(inner).toUpperCase()
}

export const newClientId = (): string => md5Hex(randomUUID()).toUpperCase()

export const newRequestId = (): string => md5Hex(randomUUID())
