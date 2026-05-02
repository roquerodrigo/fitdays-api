import type { Region } from '../types/client.js'

export const APP_VER = '1.21.0'
export const DEFAULT_DEVICE_MODEL = 'AndroidSDKbuiltforarm64-6.0'
export const USER_AGENT = 'okhttp/4.9.3'

export const REGION_HOSTS: Record<Region, string> = {
  cn: 'https://online.fitdays.cn',
  eu: 'https://online-eu.fitdays.cn',
  us: 'https://online-us.fitdays.cn',
}

/** Default sync window (~6 years / 2160 days) used by `syncAll()`. */
export const FULL_SYNC_WINDOW_SECONDS = 186624000
