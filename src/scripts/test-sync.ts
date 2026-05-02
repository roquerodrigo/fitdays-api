import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { FitDaysClient } from '../client/fitdays-client.js'
import { FULL_SYNC_WINDOW_SECONDS } from '../constants/api.js'

const OUTPUT_PATH = 'sync-response.json'

const formatDate = (unixSeconds: number): string =>
  new Date(unixSeconds * 1000).toISOString().slice(0, 19).replace('T', ' ')

const summarizeValue = (v: unknown): string => {
  if (Array.isArray(v)) return `array(${v.length})`
  if (v === null) return 'null'
  if (typeof v === 'object') return `object(${Object.keys(v as object).length} keys)`
  if (typeof v === 'string') return v.length > 60 ? `"${v.slice(0, 57)}..."` : `"${v}"`
  return String(v)
}

const main = async (): Promise<void> => {
  process.loadEnvFile('.env')
  const email = process.env.FITDAYS_EMAIL
  const password = process.env.FITDAYS_PASSWORD
  if (!email || !password) {
    console.error('Missing FITDAYS_EMAIL or FITDAYS_PASSWORD in .env')
    process.exit(1)
  }

  const client = new FitDaysClient({ region: 'us' })
  console.log('→ login as', email)
  const session = await client.login(email, password)
  console.log('  uid:', session.uid)
  console.log('  token:', session.token.slice(0, 12) + '…')

  const now = Math.floor(Date.now() / 1000)
  const startTime = now
  const endTime = now - FULL_SYNC_WINDOW_SECONDS
  console.log(`→ syncFromServer ${formatDate(endTime)} → ${formatDate(startTime)}`)
  const sync = await client.syncFromServer({ endTime, startTime })

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(sync, null, 2), 'utf8')

  console.log()
  console.log('=== Sync summary ===')
  console.log('code:', sync.code, sync.msg ? `(${sync.msg})` : '')
  if (sync.data && typeof sync.data === 'object') {
    const entries = Object.entries(sync.data).sort(([a], [b]) => a.localeCompare(b))
    const keyWidth = Math.max(...entries.map(([k]) => k.length), 0)
    for (const [k, v] of entries) {
      console.log(`  ${k.padEnd(keyWidth)}  ${summarizeValue(v)}`)
    }
  }
  console.log()
  console.log('saved to:', OUTPUT_PATH)
}

await main()
