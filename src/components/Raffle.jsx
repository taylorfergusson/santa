import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { supabase } from '../supabase.js'
import { RAFFLE } from '../config.js'
import Photo from './Photo.jsx'

const MAX = 999

// Home: guess how many presents Jenn has to re-wrap because of Cardi.
// Guesses are secret: everyone sees who has entered, never the numbers.
export default function Raffle() {
  const { me, people } = useAuth()
  const [saved, setSaved] = useState(undefined) // undefined = loading, null = no guess yet
  const [guess, setGuess] = useState('')
  const [entrants, setEntrants] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isOwner = me.slug === RAFFLE.slug

  const load = () =>
    Promise.all([
      supabase.from('guesses').select('guess').eq('person_id', me.id).maybeSingle(),
      supabase.from('raffle_entrants').select('person_id'),
    ]).then(([mine, all]) => {
      if (mine.error || all.error) return setError("Couldn't load the raffle. Check your connection and try again.")
      setSaved(mine.data?.guess ?? null)
      setGuess(mine.data ? String(mine.data.guess) : '')
      setEntrants(all.data.map((e) => e.person_id))
    })

  useEffect(() => {
    load()
  }, [me.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = guess === '' ? null : Number(guess)
  const valid = value !== null && Number.isInteger(value) && value >= 0 && value <= MAX
  const changed = valid && value !== saved

  const step = (by) => setGuess(String(Math.min(MAX, Math.max(0, (valid ? value : 0) + by))))

  const save = async (e) => {
    e.preventDefault()
    if (!changed) return
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('set_guess', { new_guess: value })
    setBusy(false)
    if (error) return setError("That didn't save. Check your connection and try again.")
    setSaved(value)
    if (!entrants.includes(me.id)) setEntrants((all) => [...all, me.id])
  }

  const entered = people.filter((p) => entrants.includes(p.id))

  return (
    <section className="raffle" aria-label={`${RAFFLE.pet} raffle`}>
      <div className="raffle-sky">
        <Litter />
        <div className="raffle-head">
          <h2 className="raffle-title">How many gifts will {RAFFLE.pet} destroy?</h2>
          <CatFrenzy />
        </div>

        {isOwner ? (
          <p className="raffle-owner">Not you, {RAFFLE.owner} 😼</p>
        ) : (
          saved !== undefined && (
            <form className="raffle-form" onSubmit={save}>
              <button type="button" className="raffle-step" onClick={() => step(-1)} aria-label="One fewer">
                −
              </button>
              <input
                className="raffle-input"
                type="number"
                inputMode="numeric"
                min="0"
                max={MAX}
                placeholder="?"
                value={guess}
                onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, 3))}
                aria-label="Your guess"
              />
              <button type="button" className="raffle-step" onClick={() => step(1)} aria-label="One more">
                +
              </button>
              {changed ? (
                <button className="btn btn-primary raffle-save" disabled={busy}>
                  Save
                </button>
              ) : (
                saved !== null && <span className="raffle-saved" aria-label="Saved">✓</span>
              )}
            </form>
          )
        )}
        {error && <p className="field-error">{error}</p>}
      </div>

      {entered.length > 0 && (
        <div className="raffle-entrants">
          <div className="raffle-faces">
            {entered.map((p) => (
              <Photo key={p.id} src={p.photo_url} alt={p.name} className="raffle-face" />
            ))}
          </div>
          <span>
            {entered.length} {entered.length === 1 ? 'guess' : 'guesses'}
          </span>
        </div>
      )}
    </section>
  )
}

// ---------- Cardi's frenzy ----------

// The kinds of wrapping paper flying around (see --wrap-* in theme.css)
const PAPERS = ['stripe', 'dots', 'green', 'gold', 'cream', 'red']
const TEARS = [
  'polygon(0 12%, 100% 0, 86% 100%, 8% 84%)',
  'polygon(0 0, 100% 28%, 58% 100%)',
  'polygon(12% 0, 100% 16%, 88% 100%, 0 78%, 22% 48%)',
  'polygon(0 30%, 70% 0, 100% 70%, 30% 100%)',
]

// Same "random" scatter on every render
function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const rand = seeded(7)
const between = (lo, hi) => lo + rand() * (hi - lo)

// Shreds spraying out of the presents, mostly back across the card
const SHREDS = Array.from({ length: 15 }, (_, i) => ({
  paper: PAPERS[i % PAPERS.length],
  tear: TEARS[i % TEARS.length],
  x: Math.round(between(-300, 70)),
  y: Math.round(between(-120, 40)),
  r: Math.round(between(-540, 540)),
  size: Math.round(between(7, 16)),
  time: between(0.7, 1.2).toFixed(2),
  delay: (-between(0, 1.2)).toFixed(2),
}))

// Torn paper already everywhere: piled on the floor to the right of the
// number picker, and stuck around the top of the card
const LITTER = Array.from({ length: 20 }, (_, i) => {
  const floor = i < 10
  return {
    paper: PAPERS[(i * 5 + 2) % PAPERS.length],
    tear: TEARS[(i * 3) % TEARS.length],
    left: `${Math.round(floor ? 64 + i * 3.6 + between(-2, 2) : between(0, 96))}%`,
    top: `${Math.round(floor ? between(85, 96) : between(2, 28))}%`,
    r: Math.round(between(-80, 80)),
    size: Math.round(floor ? between(14, 26) : between(8, 14)),
  }
})

const shredStyle = (p) => ({ clipPath: p.tear, width: p.size, height: p.size * 0.75 })

function Litter() {
  return (
    <div className="raffle-litter" aria-hidden="true">
      {LITTER.map((p, i) => (
        <i
          key={i}
          className={`wrap wrap-${p.paper}`}
          style={{ ...shredStyle(p), left: p.left, top: p.top, transform: `rotate(${p.r}deg)` }}
        />
      ))}
    </div>
  )
}

// Cardi clawing at a pile of presents with both paws, paper flying everywhere.
function CatFrenzy() {
  return (
    <div className="raffle-scene" aria-hidden="true">
      <div className="raffle-shreds">
        {SHREDS.map((p, i) => (
          <i
            key={i}
            className={`wrap wrap-${p.paper} shred`}
            style={{
              ...shredStyle(p),
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.r}deg`,
              animationDuration: `${p.time}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <svg className="raffle-cat" viewBox="0 0 140 100">
        <defs>
          <pattern id="candy-paper" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" className="paper-white" />
            <rect width="4" height="8" className="paper-red" />
          </pattern>
        </defs>

        <g className="pile">
          {/* big green present at the back, already ripped open */}
          <g className="gift-shake shake-1">
            <rect className="gift-green" x="60" y="38" width="46" height="42" rx="2" />
            <rect className="ribbon-gold" x="80" y="38" width="6" height="42" />
            <path className="gift-rip" d="M62 46 L72 42 L76 52 L70 60 L64 58 Z" />
            <path className="claw-marks" d="M64 48 L70 62 M68 46 L74 60 M72 45 L78 58" />
            <path className="ribbon-gold" d="M83 38 C74 26 68 34 83 38 C98 34 92 26 83 38 Z" />
          </g>
          {/* candy-cane paper present */}
          <g className="gift-shake shake-2">
            <rect fill="url(#candy-paper)" x="98" y="60" width="36" height="34" rx="2" />
            <rect className="ribbon-green" x="113" y="60" width="6" height="34" />
            <path className="gift-rip" d="M100 64 L110 62 L106 74 Z" />
          </g>
          {/* little gold present */}
          <g className="gift-shake shake-3">
            <rect className="gift-gold" x="62" y="72" width="34" height="22" rx="2" />
            <rect className="ribbon-green" x="62" y="80" width="34" height="5" />
          </g>
        </g>

        <g className="cat-bob">
          <path className="cat-tail" d="M18 86 Q2 80 6 64 Q8 56 14 58" />
          <ellipse className="cat" cx="32" cy="70" rx="15" ry="21" />
          <circle className="cat" cx="30" cy="40" r="11" />
          <path className="cat" d="M21 35 L20 23 L28 31 Z M39 35 L41 23 L33 30 Z" />
          <ellipse className="cat-eye" cx="27" cy="39" rx="2.4" ry="3.2" />
          <ellipse className="cat-eye" cx="35" cy="39" rx="2.4" ry="3.2" />
          <ellipse className="cat-pupil" cx="27.6" cy="39" rx="0.8" ry="2.6" />
          <ellipse className="cat-pupil" cx="35.6" cy="39" rx="0.8" ry="2.6" />
          <path className="cat-nose" d="M36 45 L39 44 L38 46.5 Z" />
          <path className="cat-arm paw-a" d="M40 58 L60 48" />
          <path className="cat-arm paw-b" d="M40 66 L60 62" />
        </g>
      </svg>
    </div>
  )
}
