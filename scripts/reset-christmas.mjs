// npm run reset-christmas
// Run each January to start a fresh year. Clears all claims, suggestions and
// notices, permanently removes deleted items, optionally removes bought items,
// and updates the year in the site title.
import { readFileSync, writeFileSync } from 'node:fs'
import { YEAR } from '../src/config.js'
import { admin, ask, check, confirm } from './lib.mjs'

// Supabase won't bulk-delete without a filter; this one matches every row.
const ALL = ['id', 'is', null]

const thisYear = new Date().getFullYear()
const yearAnswer = await ask(`Year for the site title (currently ${YEAR}, press Enter for ${thisYear}): `)
const newYear = yearAnswer ? Number(yearAnswer) : thisYear
if (!Number.isInteger(newYear) || newYear < 2000 || newYear > 3000) {
  console.error('That doesn\'t look like a year.')
  process.exit(1)
}

const clearBought = await confirm('Also remove items that were bought from everyone\'s lists?')

console.log('\nThis will:')
console.log('  • remove every claim, secret suggestion and notice')
console.log('  • permanently remove items people deleted')
if (clearBought) console.log('  • remove every item someone marked as bought')
console.log(`  • change the site title year to ${newYear}`)
if (!(await confirm('\nGo ahead? This can\'t be undone.'))) {
  console.log('Nothing changed.')
  process.exit(0)
}

// Bought items have to be found before the claims are cleared
if (clearBought) {
  const bought = check(await admin.from('claims').select('item_id').eq('stage', 'bought'), 'Finding bought items')
  const ids = [...new Set(bought.map((c) => c.item_id))]
  if (ids.length) check(await admin.from('items').delete().in('id', ids), 'Removing bought items')
  console.log(`✓ Removed ${ids.length} bought item(s)`)
}

check(await admin.from('claims').delete().not(...ALL), 'Clearing claims')
console.log('✓ Cleared claims')

check(await admin.from('notices').delete().not(...ALL), 'Clearing notices')
console.log('✓ Cleared notices')

check(await admin.from('items').delete().eq('is_suggestion', true), 'Clearing suggestions')
console.log('✓ Cleared secret suggestions')

check(await admin.from('items').delete().not('deleted_at', 'is', null), 'Removing deleted items')
console.log('✓ Removed deleted items')

// Update the year in the site title
function replaceInFile(relativePath, pattern, replacement) {
  const url = new URL(`../${relativePath}`, import.meta.url)
  writeFileSync(url, readFileSync(url, 'utf8').replace(pattern, replacement))
}
replaceInFile('src/config.js', /export const YEAR = \d{4}/, `export const YEAR = ${newYear}`)
replaceInFile('index.html', /Family Santa Wishlist \d{4}/, `Family Santa Wishlist ${newYear}`)
console.log(`✓ Site title now says ${newYear}`)

console.log('\nDone. Run `npm run build`, then commit and push so the new year shows on the site.')
