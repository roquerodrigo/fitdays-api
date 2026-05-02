import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { javaUrlEncode } from '../utils/encode.js'

describe('javaUrlEncode', () => {
  it('returns empty for empty input', () => {
    assert.equal(javaUrlEncode(''), '')
  })

  it('keeps unreserved chars A-Za-z0-9 -_.* untouched', () => {
    assert.equal(javaUrlEncode('Hello-World_v1.2.3*'), 'Hello-World_v1.2.3*')
  })

  it('encodes space as "+", not "%20" (form-urlencoded)', () => {
    assert.equal(javaUrlEncode('a b c'), 'a+b+c')
  })

  it('percent-encodes "!", "\'", "(", ")", "~" — kept by encodeURIComponent but not here', () => {
    assert.equal(javaUrlEncode('!'), '%21')
    assert.equal(javaUrlEncode('\''), '%27')
    assert.equal(javaUrlEncode('('), '%28')
    assert.equal(javaUrlEncode(')'), '%29')
    assert.equal(javaUrlEncode('~'), '%7E')
  })

  it('percent-encodes reserved chars like "&" and "="', () => {
    assert.equal(javaUrlEncode('a=b&c=d'), 'a%3Db%26c%3Dd')
  })

  it('handles multibyte UTF-8 (one byte = one %XX pair)', () => {
    // "ç" is 0xC3 0xA7 in UTF-8
    assert.equal(javaUrlEncode('ç'), '%C3%A7')
  })
})
