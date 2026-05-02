import { hashPassword } from '../utils/crypto.js'
import { buildSign } from '../utils/sign.js'

// Sanity check for the password hashing path:
//   md5("abchx") -> 7E2573EB5450B121F91F8CBAB85D5E4B (uppercased)
//   md5("7E2573EB5450B121F91F8CBAB85D5E4B") -> C3C92D8A2EE88EEA2FCADE3737066C00
const PWD_KNOWN = 'C3C92D8A2EE88EEA2FCADE3737066C00'
const PWD_GOT = hashPassword('abc')
console.log('password expected:', PWD_KNOWN)
console.log('password got:     ', PWD_GOT)
if (PWD_GOT !== PWD_KNOWN) {
  console.error('FAIL: password hash mismatch')
  process.exit(1)
}

const params = {
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

const expected = 'd201da49271424d1593163b9355f99bc'
const got = buildSign(params)
console.log('expected:', expected)
console.log('got:     ', got)
if (got !== expected) {
  console.error('FAIL: sign mismatch')
  process.exit(1)
}
console.log('OK: sign matches the reference value')
