export { FitDaysClient } from './client/fitdays-client.js'
export {
  APP_VER,
  DEFAULT_DEVICE_MODEL,
  FULL_SYNC_WINDOW_SECONDS,
  REGION_HOSTS,
  USER_AGENT,
} from './constants/api.js'
export { PASSWORD_SALT, SIGN_SECRET } from './constants/sign.js'
export { FitDaysApiError } from './errors/api-error.js'
export type { ApiResponse, LoginData } from './types/api.js'
export type { ClientOptions, Region, Session } from './types/client.js'
export type { SignParams } from './types/sign.js'
export type {
  AccountInfo,
  BalanceRecord,
  BindDevice,
  Device,
  GravityRecord,
  HeightRecord,
  HrRecord,
  ImpedanceRecord,
  Product,
  RulerRecord,
  SkipRecord,
  SyncFromServerData,
  SyncFromServerDataRaw,
  User,
  WeightExtData,
  WeightRecord,
  WeightRecordRaw,
} from './types/sync.js'
export { hashPassword, md5Hex, newClientId, newRequestId } from './utils/crypto.js'
export { javaUrlEncode } from './utils/encode.js'
export { parseSyncFromServerData, parseWeightRecord } from './utils/parse-sync.js'
export { buildSign } from './utils/sign.js'
