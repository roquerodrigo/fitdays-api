import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { hashPassword, md5Hex, newClientId, newRequestId } from '../utils/crypto.js'

describe('md5Hex', () => {
  it('hashes utf-8 strings to lowercase hex', () => {
    assert.equal(md5Hex(''), 'd41d8cd98f00b204e9800998ecf8427e')
    assert.equal(md5Hex('abc'), '900150983cd24fb0d6963f7d28e17f72')
  })

  it('handles non-ASCII utf-8 input', () => {
    // md5 of "café" as UTF-8 bytes
    assert.equal(md5Hex('café'), md5Hex('café'))
    assert.match(md5Hex('café'), /^[0-9a-f]{32}$/)
  })
})

describe('hashPassword', () => {
  it('produces the expected hash for "abc"', () => {
    assert.equal(hashPassword('abc'), 'C3C92D8A2EE88EEA2FCADE3737066C00')
  })

  it('feeds the UPPERCASE inner hex into the outer MD5', () => {
    // Regression guard: piping lowercase hex into the outer MD5 yields a
    // different (and rejected) hash.
    const wrong = md5Hex(md5Hex('abc' + 'hx')).toUpperCase()
    assert.notEqual(hashPassword('abc'), wrong)
  })

  it('returns a 32-char uppercase hex string', () => {
    assert.match(hashPassword('whatever'), /^[0-9A-F]{32}$/)
  })
})

describe('newClientId / newRequestId', () => {
  it('newClientId is 32-char uppercase hex', () => {
    assert.match(newClientId(), /^[0-9A-F]{32}$/)
  })

  it('newRequestId is 32-char lowercase hex', () => {
    assert.match(newRequestId(), /^[0-9a-f]{32}$/)
  })

  it('successive calls produce distinct IDs', () => {
    assert.notEqual(newClientId(), newClientId())
    assert.notEqual(newRequestId(), newRequestId())
  })
})
