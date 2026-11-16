// The year is updated each January by `npm run reset-christmas`
// (it also updates the <title> in index.html).
export const YEAR = 2026
export const SITE_TITLE = `Family Santa Wishlist ${YEAR}`
export const SITE_SUBTITLE = 'Fergusson Extended Universe'

// Supabase project. The publishable key is meant to be public:
// row-level security protects the data. Never put the secret key here.
export const SUPABASE_URL = 'https://vgydopygcsjrrtuitpni.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ro1vUW6oIRJbcPCvLB2nMw_swxb8pnW'

// Supabase passwords must be 6+ characters and the family passcode is 4 digits,
// so every password is this prefix + the passcode. The passcode itself is never
// stored in the repo; it's set with `npm run set-passcode`.
export const PASSWORD_PREFIX = 'feu-'

// This person sits at the top of the Christmas tree for everyone else.
// They see their own tree in plain alphabetical order.
export const TREE_TOPPER = 'Laura'

// Login emails are placeholders, e.g. taylor@feu.local
export const emailFor = (slug) => `${slug}@feu.local`

// Home page countdowns. Regina doesn't change clocks, so it's always UTC-6.
export const CHRISTMAS_AT = `${YEAR}-12-25T00:00:00-06:00`
export const ARRIVAL = { name: 'Taylor', at: `${YEAR}-12-17T01:20:00-06:00` }

// Gag gift: everyone gets one, so it's pinned to the top of every Shopping list.
export const GAG_GIFT = { budget: '$12', items: ['Silly socks', 'Silly snack'] }

// The Cardi raffle on Home: closest guess wins a surprise prize.
// `slug` is the person who can't enter (it's her cat). The database checks this too.
export const RAFFLE = { owner: 'Jenn', slug: 'jenn', pet: 'Cardi' }
