import { useEffect, useState } from 'react'
import { ARRIVAL, CHRISTMAS_AT } from '../config.js'

const pad = (n) => String(n).padStart(2, '0')

function split(ms) {
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor(s / 3600) % 24,
    mins: Math.floor(s / 60) % 60,
    secs: s % 60,
  }
}

function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// One reindeer mid-leap, facing right. Drawn about 44 x 32.
function Reindeer({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="20" cy="20" rx="13" ry="6" />
      <path d="M29 17 L35 7 L43 9 L42 12 L37 12 L33 21 Z" />
      <path className="sleigh-line" d="M35 7 L32 0 M33.5 3.5 L29.5 1.5 M36.5 7 L40 0 M38.5 3.5 L42.5 2" />
      <path className="sleigh-leg" d="M30 22 L38 25 L41 23 M27 24 L34 30 M11 22 L3 24 L1 27 M13 24 L6 30 M8 17 L4 14" />
    </g>
  )
}

// Santa, his sack and three reindeer as one silhouette, crossing the moon.
function SantaSleigh() {
  return (
    <svg className="sleigh" viewBox="0 0 210 80" aria-hidden="true">
      {/* drawn facing right, flipped so the team flies left across the moon */}
      <g transform="translate(210 0) scale(-1 1)">
      <path className="sleigh-trail" d="M-60 74 C-20 76 0 62 6 58" />
      <g className="sleigh-body">
        {/* reins and harness */}
        <path className="sleigh-rein" d="M46 45 Q90 46 107 30 M107 30 L147 22 L178 14" />
        {/* sack */}
        <circle cx="17" cy="36" r="10" />
        <path d="M13 27 L16 22 L21 23 L20 28 Z" />
        {/* Santa */}
        <ellipse cx="32" cy="38" rx="9" ry="10" />
        <circle cx="35" cy="25" r="5.5" />
        <path d="M29 23 Q33 13 44 17 L48 23 L44 22 Q40 19 39 23 Z" />
        <circle cx="48.5" cy="24.5" r="2.4" />
        <path className="sleigh-arm" d="M36 36 L46 45" />
        {/* sleigh */}
        <path d="M5 56 L7 40 Q7 34 2 32 Q11 29 15 38 L19 46 L54 46 Q60 46 63 38 L66 35 Q68 44 60 56 Z" />
        <path className="sleigh-runner" d="M3 63 L60 63 Q71 63 71 54 Q71 48 66 49" />
        <path className="sleigh-line" d="M14 56 L15 63 M50 56 L49 63" />
        <Reindeer x={86} y={28} />
        <Reindeer x={126} y={19} />
        <Reindeer x={166} y={9} />
      </g>
      </g>
    </svg>
  )
}

// Home page: a retro night-sky poster counting the sleeps until Christmas,
// with a ticker strip underneath for when Taylor lands.
export default function Countdown() {
  const now = useNow()
  const toChristmas = new Date(CHRISTMAS_AT) - now
  const toArrival = new Date(ARRIVAL.at) - now
  const c = split(Math.max(toChristmas, 0))
  const a = split(Math.max(toArrival, 0))

  return (
    <section className="countdown" aria-label="Countdown to Christmas">
      <div className="countdown-sky">
        <div className="countdown-moon" />
        <SantaSleigh />
        <span className="countdown-star s1">✦</span>
        <span className="countdown-star s2">✦</span>
        <span className="countdown-star s3">✧</span>
        <span className="countdown-star s4">✦</span>

        {toChristmas > 0 ? (
          <div className="countdown-poster" role="timer">
            <span className="countdown-days">{c.days}</span>
            <span className="countdown-words">
              <span className="countdown-sleeps">{c.days === 1 ? 'sleep' : 'sleeps'}</span>
              <span className="countdown-til">'til Christmas!</span>
            </span>
            <span className="countdown-clock">
              <b>{pad(c.hours)}</b>h <b>{pad(c.mins)}</b>m <b>{pad(c.secs)}</b>s
            </span>
          </div>
        ) : (
          <p className="countdown-poster countdown-done">Merry Christmas!</p>
        )}
      </div>

      <div className="countdown-sub">
        <span className="countdown-sub-title">✈︎ {ARRIVAL.name} lands in</span>
        <span className="countdown-sub-time" role="timer">
          {toArrival > 0
            ? `${a.days ? `${a.days}d ` : ''}${a.hours}h ${pad(a.mins)}m ${pad(a.secs)}s`
            : `${ARRIVAL.name}'s here!`}
        </span>
      </div>
    </section>
  )
}
