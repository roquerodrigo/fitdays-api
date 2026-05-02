import type {
  SyncFromServerData,
  SyncFromServerDataRaw,
  WeightExtData,
  WeightRecord,
  WeightRecordRaw,
} from '../types/sync.js'

/** Parse the JSON-encoded `ext_data` field of a single weight record. */
export const parseWeightRecord = (raw: WeightRecordRaw): WeightRecord => ({
  ...raw,
  ext_data: JSON.parse(raw.ext_data) as WeightExtData,
})

/** Walk a sync response and parse every `weight_list[i].ext_data`. */
export const parseSyncFromServerData = (raw: SyncFromServerDataRaw): SyncFromServerData => ({
  ...raw,
  weight_list: raw.weight_list.map(parseWeightRecord),
})
