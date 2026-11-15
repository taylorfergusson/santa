// Shared helpers for the admin scripts. These run on Taylor's computer only.
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, emailFor } from '../src/config.js'

// Reads the Supabase secret key from .env. Accepts either
//   SUPABASE_SECRET_KEY=sb_secret_...
// or just the key on its own line.
function readSecretKey() {
  let text
  try {
    text = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  } catch {
    throw new Error('No .env file found. Create one with SUPABASE_SECRET_KEY=sb_secret_...')
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const value = line.startsWith('SUPABASE_SECRET_KEY=') ? line.slice('SUPABASE_SECRET_KEY='.length) : line
    if (value.startsWith('sb_secret_')) return value.trim()
  }
  throw new Error('Couldn\'t find the Supabase secret key (sb_secret_...) in .env')
}

// Admin client: bypasses row-level security. Never use this key in the app.
export const admin = createClient(SUPABASE_URL, readSecretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
})

export { emailFor }
export const slugify = (name) => name.trim().toLowerCase()

// Ask a question in the terminal and return the answer.
export async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer.trim()
}

export async function confirm(question) {
  const answer = await ask(`${question} (y/n) `)
  return answer.toLowerCase().startsWith('y')
}

// Stop with a readable message if a Supabase call failed.
export function check({ data, error }, what) {
  if (error) {
    console.error(`\n✗ ${what} failed: ${error.message}`)
    process.exit(1)
  }
  return data
}

// Every auth user in the project (the family is small, one page is plenty).
export async function listAuthUsers() {
  const data = check(await admin.auth.admin.listUsers({ perPage: 1000 }), 'Listing users')
  return data.users
}
