// Shared item logic: labels, loading lists, claim text, links and photos.
import { supabase } from './supabase.js'

// Keep these labels exactly as written, including capitalization.
// label: used on item pages and the priority picker. heading: the section titles on lists.
export const PRIORITIES = [
  { value: 1, label: 'NEED SO BAD', heading: 'NEED SO BAD' },
  { value: 2, label: 'want', heading: 'Want' },
  { value: 3, label: 'nice to have', heading: 'Nice to Have' },
]
export const priorityLabel = (value) => PRIORITIES.find((p) => p.value === value)?.label

export const TYPES = {
  exact: { label: 'Exact', hint: 'A specific thing' },
  flexible: { label: 'Flexible', hint: 'Something like this' },
}

// Can this person edit the item? Owners and managers edit real items;
// whoever made a suggestion edits that suggestion.
export function canEditItem(item, me, owner) {
  if (!item || !me) return false
  if (item.is_suggestion) return item.created_by === me.id
  return item.owner_id === me.id || Boolean(owner?.managed_by.includes(me.id))
}

// Everything on someone's list, each with its claim status attached.
// The database hides claims and suggestions on your own list, so for your
// own list `status` is always null and there are no suggestions.
export async function loadList(ownerId) {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('created_at')
  if (error) throw error
  return attachStatus(items)
}

// Every wishlist item on other people's lists (not suggestions), newest first,
// with claim status. Used for the Home overview and the Family tree counts.
export async function loadOthersItems(meId) {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .neq('owner_id', meId)
    .eq('is_suggestion', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return attachStatus(items)
}

// Per person: how many wishlist items, and how many someone is already getting
export function countByOwner(items) {
  const counts = {}
  for (const item of items) {
    const c = (counts[item.owner_id] ??= { total: 0, taken: 0 })
    c.total += 1
    if (item.status?.claim_count) c.taken += 1
  }
  return counts
}

export async function loadItem(id) {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [item] = await attachStatus([data])
  return item
}

async function attachStatus(items) {
  if (!items.length) return items
  const { data: statuses } = await supabase
    .from('claim_status')
    .select('*')
    .in('item_id', items.map((i) => i.id))
  const byItem = Object.fromEntries((statuses ?? []).map((s) => [s.item_id, s]))
  return items.map((i) => ({ ...i, status: byItem[i.id] ?? null }))
}

// What a giver sees about claims on an item. `dimmed` greys out Exact items
// someone else is getting.
export function claimInfo(item) {
  const s = item.status
  if (!s || !s.claim_count) return { text: '', dimmed: false }
  const exact = item.type === 'exact'
  if (s.my_stage) {
    const stage = s.my_stage === 'bought' ? 'Bought' : 'Planning'
    return { text: `${exact ? 'You\'re getting this' : 'You\'re getting one'} · ${stage}`, dimmed: false }
  }
  if (exact) {
    return { text: `Someone's getting this · ${s.bought_count ? 'Bought' : 'Planning'}`, dimmed: true }
  }
  return { text: 'Someone\'s getting one, more welcome', dimmed: false }
}

// ---------- Questions ----------

// Questions on a profile, newest first. Never includes who asked
// (asked_by_me only says whether it was you).
export async function loadQuestions(profileId) {
  const { data, error } = await supabase
    .from('questions_public')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// How many unanswered questions are waiting on these profiles (yours + managed)
export async function countWaitingQuestions(profileIds) {
  const { count } = await supabase
    .from('questions_public')
    .select('id', { count: 'exact', head: true })
    .in('profile_id', profileIds)
    .is('answer', null)
  return count ?? 0
}

// The unanswered questions waiting on these profiles (yours + managed), oldest first
export async function loadWaitingQuestions(profileIds) {
  const { data, error } = await supabase
    .from('questions_public')
    .select('*')
    .in('profile_id', profileIds)
    .is('answer', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ---------- Links ----------

const looksLikeDomain = (text) => /^[^\s]+\.[a-z]{2,}(\/|$)/i.test(text)

export const isUrl = (text) => /^https?:\/\//i.test(text)

// "simons.ca/item" -> "https://simons.ca/item". Plain words (brand names) stay as they are.
export function normalizeLink(text) {
  const trimmed = text.trim()
  if (!trimmed || isUrl(trimmed)) return trimmed
  return looksLikeDomain(trimmed) ? `https://${trimmed}` : trimmed
}

// Short readable label for a link button, e.g. "simons.ca"
export function linkLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ---------- Photos ----------

const MAX_PHOTO_SIZE = 1600 // longest side in pixels

// Shrinks a phone photo to a reasonable JPEG before upload.
async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_PHOTO_SIZE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  } catch {
    return file // browser can't read it; upload as-is and let storage decide
  }
}

// Uploads a photo to your own folder and returns its public URL.
export async function uploadPhoto(file) {
  const { data: auth } = await supabase.auth.getUser()
  const blob = await shrinkImage(file)
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg')
  const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: blob.type })
  if (error) throw error
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}

// ---------- Notices ----------
// Quiet messages like "Laura removed an item you'd claimed". The database only
// ever returns your own notices.

export async function loadNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('id, item_id, message, created_at')
    .is('seen_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Mark one notice seen, or (with itemId) every notice about that item
export async function dismissNotices({ id, itemId }) {
  const query = supabase.from('notices').update({ seen_at: new Date().toISOString() }).is('seen_at', null)
  await (id ? query.eq('id', id) : query.eq('item_id', itemId)) // queries only run when awaited
}

// Did the owner change the item after you claimed it?
export const editedAfterClaim = (item, claimedAt) =>
  Boolean(item.edited_at && claimedAt && new Date(item.edited_at) > new Date(claimedAt))
