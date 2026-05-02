import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { SignParams } from '../types/sign.js'

import { buildSign } from '../utils/sign.js'

const baseParams: SignParams = {
  app_ver: '1.21.0',
  client_id: 'DC156F861A09E36508B5AF9EBBFD49F1',
  country: 'US',
  device_model: 'AndroidSDKbuiltforarm64-6.0',
  language: 'en',
  os_type: '0',
  request_id: '1fbbaba4e2de090c8a39df5c0a0f8163',
  source: '0',
  timestamp: '1777683482',
  token: '',
  uid: '0',
}

describe('buildSign', () => {
  it('produces the expected signature for the reference vector', () => {
    assert.equal(buildSign(baseParams), 'd201da49271424d1593163b9355f99bc')
  })

  it('changes when any single param changes', () => {
    const ref = buildSign(baseParams)
    assert.notEqual(buildSign({ ...baseParams, timestamp: '1777683483' }), ref)
    assert.notEqual(buildSign({ ...baseParams, token: 'abc' }), ref)
    assert.notEqual(buildSign({ ...baseParams, uid: '1' }), ref)
  })

  it('returns 32 lowercase hex chars', () => {
    assert.match(buildSign(baseParams), /^[0-9a-f]{32}$/)
  })
})
