// npm run set-passcode
// Sets every login's password to the app prefix + the 4-digit family passcode.
// The passcode is typed here and never saved anywhere in the repo.
import { PASSWORD_PREFIX } from '../src/config.js'
import { admin, ask, check } from './lib.mjs'

const passcode = await ask('New 4-digit family passcode: ')
if (!/^\d{4}$/.test(passcode)) {
  console.error('The passcode must be exactly 4 digits.')
  process.exit(1)
}

const people = check(
  await admin.from('people').select('name, auth_user_id').not('auth_user_id', 'is', null).order('sort_order'),
  'Reading people',
)
if (!people.length) {
  console.error('Nobody has a login yet. Run `npm run sync-family` first.')
  process.exit(1)
}

for (const person of people) {
  check(
    await admin.auth.admin.updateUserById(person.auth_user_id, { password: PASSWORD_PREFIX + passcode }),
    `Setting passcode for ${person.name}`,
  )
  console.log(`✓ ${person.name}`)
}

console.log('\nDone. Everyone logs in with the new passcode from now on.')
