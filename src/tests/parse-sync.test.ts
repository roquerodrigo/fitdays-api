import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { SyncFromServerDataRaw, WeightRecordRaw } from '../types/sync.js'

import { parseSyncFromServerData, parseWeightRecord } from '../utils/parse-sync.js'

const sampleExt = JSON.stringify({
  age: 29,
  arm: 0,
  armAndLegBalance: 0,
  armBalance: 0,
  bfmControl: -29,
  bfmMax: 15,
  bfmMin: 7.5,
  bfmStandard: 9.4,
  bfpMax: 20,
  bfpMin: 10,
  bfpStandard: 15,
  bmiMax: 30,
  bmiMin: 25,
  bmiStandard: 22,
  bmrMax: 1675,
  bmrMin: 1370,
  bmrStandard: 1523,
  bodyScore: 65,
  bodyType: 8,
  boneMax: 3.8,
  boneMin: 3.1,
  chest: 0,
  dataType: 0,
  deviceModelExt: '',
  deviceNameExt: 'HC059',
  deviceSoftwareVer: '',
  ffmControl: 0,
  ffmStandard: 53.4,
  height: 169,
  hip: 0,
  is_show_circumference_layout: 0,
  legBalance: 0,
  muscleMassMax: 53.4,
  muscleMassMin: 42.8,
  neck: 0,
  obesityDegree: 168,
  onlyMeasureWeight: '0',
  originalImps: '',
  peopleType: 0,
  proteinMassMax: 11.4,
  proteinMassMin: 9.2,
  sex: 0,
  smi: 0,
  smmMax: 32.7,
  smmMin: 26.7,
  smmStandard: 29.7,
  targetBodyfatMass: 0,
  targetSMMMass: 0,
  targetWeight: 76.7,
  thigh: 0,
  waist: 0,
  waterMassMax: 41.9,
  waterMassMin: 33.6,
  weightControl: -29,
  weightMax: 72.3,
  weightMin: 53.4,
  weightStandard: 62.8,
  whr: 0,
})

const rawWeight: WeightRecordRaw = {
  adc: 526,
  adc_list: '526',
  app_ver: '1.27.5',
  balance_data_id: '',
  bfa_type: 1,
  bfr: 36.4,
  bm: 3.49,
  bmi: 37,
  bmr: 1976,
  bodyage: 34,
  created_at: '2026-04-18 10:21:31',
  data_calc_type: 0,
  data_id: '786f7cb55c890c647938b0271dee4471',
  device_id: '57f970ce791d6ff7b8ab5bba5e8848ec',
  electrode: 4,
  ext_data: sampleExt,
  gravity_data_id: '',
  hr: 0,
  id: 1559013,
  imp_data_id: '',
  is_deleted: 1,
  kg_scale_division: 3,
  lb_scale_division: 4,
  measured_time: 1776507687,
  pp: 15.7,
  rom: 59.7,
  rosm: 43.8,
  sfr: 23.5,
  source: 0,
  suid: 91743895,
  uid: 91743873,
  updated_at: '2026-04-18 10:26:39',
  uvi: 16.1,
  vwc: 44.6,
  weight_g: 105670,
  weight_kg: 105.7,
  weight_lb: 233,
}

describe('parseWeightRecord', () => {
  it('parses ext_data into a typed object', () => {
    const parsed = parseWeightRecord(rawWeight)
    assert.equal(typeof parsed.ext_data, 'object')
    assert.equal(parsed.ext_data.age, 29)
    assert.equal(parsed.ext_data.bodyType, 8)
    assert.equal(parsed.ext_data.deviceNameExt, 'HC059')
  })

  it('preserves all non-ext_data fields verbatim', () => {
    const parsed = parseWeightRecord(rawWeight)
    assert.equal(parsed.id, rawWeight.id)
    assert.equal(parsed.uid, rawWeight.uid)
    assert.equal(parsed.weight_kg, rawWeight.weight_kg)
    assert.equal(parsed.measured_time, rawWeight.measured_time)
  })

  it('throws on invalid JSON in ext_data', () => {
    assert.throws(() => parseWeightRecord({ ...rawWeight, ext_data: 'not json' }))
  })
})

describe('parseSyncFromServerData', () => {
  const rawData: SyncFromServerDataRaw = {
    account: { uid: 1 } as SyncFromServerDataRaw['account'],
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
    weight_list: [rawWeight, rawWeight],
  }

  it('maps every weight record', () => {
    const parsed = parseSyncFromServerData(rawData)
    assert.equal(parsed.weight_list.length, 2)
    for (const w of parsed.weight_list) {
      assert.equal(typeof w.ext_data, 'object')
      assert.equal(w.ext_data.age, 29)
    }
  })

  it('passes through other fields unchanged (same reference)', () => {
    const parsed = parseSyncFromServerData(rawData)
    assert.equal(parsed.account, rawData.account)
    assert.equal(parsed.devices, rawData.devices)
    assert.equal(parsed.height_list, rawData.height_list)
  })

  it('handles an empty weight_list', () => {
    const parsed = parseSyncFromServerData({ ...rawData, weight_list: [] })
    assert.deepEqual(parsed.weight_list, [])
  })
})
