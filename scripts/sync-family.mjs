// npm run sync-family
// Makes Supabase match family.json: creates or updates each person's login and
// profile, uploads their photo, and (after asking) removes anyone not listed.
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { admin, check, confirm, emailFor, listAuthUsers, slugify } from './lib.mjs'

const PHOTO_SIZE = 600 // profile photos are resized to a 600x600 square JPEG

// ---------- Read and check family.json ----------

let family
try {
  family = JSON.parse(readFileSync(new URL('../family.json', import.meta.url), 'utf8'))
} catch (err) {
  console.error(`Couldn't read family.json: ${err.message}`)
  process.exit(1)
}

const slugs = family.map((p) => slugify(p.name))
if (new Set(slugs).size !== slugs.length) {
  console.error('Two people in family.json have the same name.')
  process.exit(1)
}
for (const person of family) {
  for (const manager of person.managedBy ?? []) {
    if (!slugs.includes(slugify(manager))) {
      console.error(`${person.name} is managed by "${manager}", who isn't in family.json.`)
      process.exit(1)
    }
  }
}

// ---------- Create or update everyone ----------

const authUsers = await listAuthUsers()
const existingPeople = check(await admin.from('people').select('id, slug, auth_user_id'), 'Reading people')
const newLogins = []

for (const [index, person] of family.entries()) {
  const slug = slugify(person.name)
  const canLogIn = person.login !== false
  const existing = existingPeople.find((p) => p.slug === slug)

  // Login (Supabase auth user)
  let authUserId = null
  const authUser = authUsers.find((u) => u.email === emailFor(slug))
  if (canLogIn) {
    if (authUser) {
      authUserId = authUser.id
    } else {
      // Random password until `npm run set-passcode` sets the real one
      const created = check(
        await admin.auth.admin.createUser({ email: emailFor(slug), password: randomUUID(), email_confirm: true }),
        `Creating login for ${person.name}`,
      )
      authUserId = created.user.id
      newLogins.push(person.name)
    }
  } else if (authUser) {
    // Person was switched to no login (e.g. a managed profile)
    check(await admin.auth.admin.deleteUser(authUser.id), `Removing login for ${person.name}`)
  }

  // Profile photo
  let photoUrl = null
  if (person.photo) {
    const jpeg = await sharp(fileURLToPath(new URL(`../${person.photo}`, import.meta.url)))
      .rotate() // respect phone orientation
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer()
    const path = `people/${slug}.jpg`
    check(
      await admin.storage.from('photos').upload(path, jpeg, { contentType: 'image/jpeg', upsert: true }),
      `Uploading photo for ${person.name}`,
    )
    // The ?v= part changes when the photo changes, so phones don't show an old cached one
    const version = createHash('md5').update(jpeg).digest('hex').slice(0, 8)
    photoUrl = `${admin.storage.from('photos').getPublicUrl(path).data.publicUrl}?v=${version}`
  }

  // People row
  const row = { name: person.name.trim(), slug, photo_url: photoUrl, sort_order: index, auth_user_id: authUserId }
  if (existing) {
    check(await admin.from('people').update(row).eq('id', existing.id), `Updating ${person.name}`)
  } else {
    check(await admin.from('people').insert(row), `Adding ${person.name}`)
  }
  console.log(`✓ ${person.name}${canLogIn ? '' : ' (no login)'}`)
}

// ---------- Managers (needs everyone's id, so it runs second) ----------

const people = check(await admin.from('people').select('id, name, slug, auth_user_id'), 'Reading people')
const idFor = (name) => people.find((p) => p.slug === slugify(name)).id

for (const person of family) {
  const managedBy = (person.managedBy ?? []).map(idFor)
  check(
    await admin.from('people').update({ managed_by: managedBy }).eq('slug', slugify(person.name)),
    `Setting managers for ${person.name}`,
  )
  if (managedBy.length) console.log(`✓ ${person.name} is managed by ${person.managedBy.join(' and ')}`)
}

// ---------- Remove anyone no longer in family.json ----------

const removed = people.filter((p) => !slugs.includes(p.slug))
if (removed.length) {
  const names = removed.map((p) => p.name).join(', ')
  console.log(`\nNot in family.json anymore: ${names}`)
  console.log('Removing them also deletes their list, claims and questions.')
  if (await confirm('Remove them?')) {
    for (const person of removed) {
      if (person.auth_user_id) {
        check(await admin.auth.admin.deleteUser(person.auth_user_id), `Removing login for ${person.name}`)
      }
      check(await admin.from('people').delete().eq('id', person.id), `Removing ${person.name}`)
      await admin.storage.from('photos').remove([`people/${person.slug}.jpg`])
      console.log(`✓ Removed ${person.name}`)
    }
  } else {
    console.log('Skipped removing.')
  }
}

console.log('\nDone.')
if (newLogins.length) {
  console.log(`New logins for ${newLogins.join(', ')}. Run \`npm run set-passcode\` so they can log in.`)
}
