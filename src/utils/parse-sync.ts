import type {
  SyncFromServerData,
  SyncFromServerDataRaw,
  WeightExtData,
  WeightRecord,
  WeightRecordRaw,
} from '../types/sync.js'

const parseExtensionData = (rawExtensionData: WeightRecordRaw['ext_data']): null | WeightExtData => {
  if (!rawExtensionData) return null

  const parsedExtensionData: unknown = JSON.parse(rawExtensionData)
  return parsedExtensionData === null ? null : parsedExtensionData as WeightExtData
}

/** Normalize a raw weight record and parse its extension data. */
export const parseWeightRecord = (raw: WeightRecordRaw): WeightRecord => ({
  ...raw,
  ext_data: parseExtensionData(raw.ext_data),
})

/** Normalize sync response lists and parse its weight records. */
export const parseSyncFromServerData = (raw: SyncFromServerDataRaw): SyncFromServerData => ({
  ...raw,
  balance_list: raw.balance_list ?? [],
  bind_device: raw.bind_device ?? [],
  devices: raw.devices ?? [],
  gravity_list: raw.gravity_list ?? [],
  height_list: raw.height_list ?? [],
  hr_list: raw.hr_list ?? [],
  impedance_list: raw.impedance_list ?? [],
  products: raw.products ?? [],
  rulers_list: raw.rulers_list ?? [],
  skip_list: raw.skip_list ?? [],
  users: raw.users ?? [],
  weight_list: raw.weight_list?.map(parseWeightRecord) ?? [],
})
