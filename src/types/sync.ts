/** The owner account. Wraps the auth context plus its sub-users. */
export type AccountInfo = {
  active_suid: number
  api_url: string
  bfa_type: number
  configs_id: string
  created_at: string
  data_id: string
  email: string
  have_sign: number
  kitchen_unit: number
  last_login_device: number
  lock_bfa: number
  msuid: number
  open_id: string
  phone: string
  refresh_token: string
  ruler_unit: number
  server_id: number
  source: number
  token: string
  uid: number
  updated_at: string
  users: User[]
  weight_unit: number
}

/** Single-foot or hand-grip balance measurement. Permissive — see {@link RulerRecord}. */
export type BalanceRecord = Record<string, unknown>

/** Link between a user account and a physical device. */
export type BindDevice = {
  created_at: string
  data_id: string
  device_id: string
  id: number
  is_deleted: 0 | 1
  ms_uid: number
  remark_name: string
  source: number
  uid: number
  updated_at: string
}

/** Physical device known to the account. */
export type Device = {
  communication_type: number
  created_at: string
  data_id: string
  device_id: string
  device_type: number
  ext_data: null | string
  firmware_ver: null | string
  hardware_ver: null | string
  id: number
  mac: string
  model: string
  name: string
  sn: null | string
  source: number
  updated_at: string
  wifi_ext_data: null | string
}

/** Center-of-gravity sample emitted by some devices. Permissive. */
export type GravityRecord = Record<string, unknown>

/** Standalone height measurement. */
export type HeightRecord = {
  created_at: string
  data_id: string
  device_id: string
  height: number
  height_cm: number
  height_inch: number
  id: number
  is_deleted: 0 | 1
  measured_time: number
  source: number
  suid: number
  uid: number
  updated_at: string
}

/** Heart-rate sample. Permissive. */
export type HrRecord = Record<string, unknown>

/** Raw electrical-impedance sample. Permissive. */
export type ImpedanceRecord = Record<string, unknown>

/** Currently always empty in observed responses. */
export type Product = Record<string, unknown>

/**
 * Body-tape (ruler) measurement. The sample response had no records to infer
 * field types from, so this is a permissive fallback. Tighten it once you
 * capture a populated response.
 */
export type RulerRecord = Record<string, unknown>

/** Jump-rope (skip) workout summary. Permissive. */
export type SkipRecord = Record<string, unknown>

/**
 * Body of `data` in the response of POST /api/sync/syncFromServer.
 * `weight_list[].ext_data` is parsed from JSON by the SDK before this is exposed.
 */
export type SyncFromServerData = {
  account: AccountInfo
  balance_list: BalanceRecord[]
  bind_device: BindDevice[]
  devices: Device[]
  gravity_list: GravityRecord[]
  height_list: HeightRecord[]
  hr_list: HrRecord[]
  impedance_list: ImpedanceRecord[]
  products: Product[]
  rulers_list: RulerRecord[]
  skip_list: SkipRecord[]
  users: User[]
  weight_list: WeightRecord[]
}

/** Untransformed response — `weight_list[].ext_data` is still a JSON string. */
export type SyncFromServerDataRaw = Omit<SyncFromServerData, 'weight_list'> & { weight_list: WeightRecordRaw[] }

/** Profile of a measured user (sub-user) belonging to an account. */
export type User = {
  birthday: string
  created_at: string
  data_id: string
  height: number
  is_deleted: 0 | 1
  nickname: string
  /** Accepts both string ("0"/"1") and number forms — the API mixes them. */
  people_type: number | string
  photo: string
  sex: 0 | 1
  source: number
  suid: number
  target_weight: number
  target_weight_lb: number
  uid: number
  updated_at: string
}

/** Parsed shape of `WeightRecord.ext_data` (it is stored as a JSON string). */
export type WeightExtData = {
  age: number
  arm: number
  armAndLegBalance: number
  armBalance: number
  bfmControl: number
  bfmMax: number
  bfmMin: number
  bfmStandard: number
  bfpMax: number
  bfpMin: number
  bfpStandard: number
  bmiMax: number
  bmiMin: number
  bmiStandard: number
  bmrMax: number
  bmrMin: number
  bmrStandard: number
  bodyScore: number
  bodyType: number
  boneMax: number
  boneMin: number
  chest: number
  dataType: number
  deviceModelExt: string
  deviceNameExt: string
  deviceSoftwareVer: string
  ffmControl: number
  ffmStandard: number
  height: number
  hip: number
  is_show_circumference_layout: number
  legBalance: number
  muscleMassMax: number
  muscleMassMin: number
  neck: number
  obesityDegree: number
  onlyMeasureWeight: string
  originalImps: string
  peopleType: number
  proteinMassMax: number
  proteinMassMin: number
  sex: number
  smi: number
  smmMax: number
  smmMin: number
  smmStandard: number
  targetBodyfatMass: number
  targetSMMMass: number
  targetWeight: number
  thigh: number
  waist: number
  waterMassMax: number
  waterMassMin: number
  weightControl: number
  weightMax: number
  weightMin: number
  weightStandard: number
  whr: number
}

/**
 * One body-composition measurement, with `ext_data` already parsed by the SDK.
 *
 * - `weight_g`: integer grams
 * - `weight_kg` / `weight_lb`: float
 * - `measured_time`: unix seconds; `created_at` / `updated_at`: "YYYY-MM-DD HH:MM:SS" strings
 * - `ext_data`: parsed {@link WeightExtData} (the server stores it as a JSON
 *   string; see {@link WeightRecordRaw} for the untransformed shape)
 */
export type WeightRecord = {
  adc: number
  adc_list: string
  app_ver: string
  balance_data_id: string
  bfa_type: number
  bfr: number
  bm: number
  bmi: number
  bmr: number
  bodyage: number
  created_at: string
  data_calc_type: number
  data_id: string
  device_id: string
  electrode: number
  ext_data: WeightExtData
  gravity_data_id: string
  hr: number
  id: number
  imp_data_id: string
  is_deleted: 0 | 1
  kg_scale_division: number
  lb_scale_division: number
  measured_time: number
  pp: number
  rom: number
  rosm: number
  sfr: number
  source: number
  suid: number
  uid: number
  updated_at: string
  uvi: number
  vwc: number
  weight_g: number
  weight_kg: number
  weight_lb: number
}

/** {@link WeightRecord} before parsing — `ext_data` is still a JSON string. */
export type WeightRecordRaw = Omit<WeightRecord, 'ext_data'> & { ext_data: string }
