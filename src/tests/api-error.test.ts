import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { FitDaysApiError } from '../errors/api-error.js'

describe('FitDaysApiError', () => {
  it('is an Error with name "FitDaysApiError"', () => {
    const err = new FitDaysApiError(42, { foo: 'bar' })
    assert.ok(err instanceof Error)
    assert.equal(err.name, 'FitDaysApiError')
  })

  it('uses the default message when none is supplied', () => {
    const err = new FitDaysApiError(7, null)
    assert.equal(err.message, 'FitDays API error 7')
  })

  it('uses the supplied message when provided', () => {
    const err = new FitDaysApiError(500, null, 'kaboom')
    assert.equal(err.message, 'kaboom')
  })

  it('exposes code and response', () => {
    const payload = { code: 500, msg: 'oops' }
    const err = new FitDaysApiError(500, payload)
    assert.equal(err.code, 500)
    assert.equal(err.response, payload)
  })
})
