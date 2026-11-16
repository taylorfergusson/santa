import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { countByOwner, loadOthersItems } from '../items.js'
import { TREE_TOPPER } from '../config.js'
import Photo from '../components/Photo.jsx'
import Hero from '../components/Hero.jsx'
import treePhoto from '../assets/tree.webp'
import Notices from '../components/Notices.jsx'
import Snowfall from '../components/Snowfall.jsx'

// Matches the sideways-phone rule in app.css
const SIDEWAYS = '(orientation: landscape) and (max-height: 500px)'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])
  return matches
}

// Ornament colours cycle so neighbours look different
const ORNAMENT_STYLES = ['gold', 'red', 'silver', 'green']

// Everyone except you, alphabetically (with TREE_TOPPER first), as photo ornaments on a Christmas tree.
// Each ornament shows how many wishes they have and how many someone has claimed.
export default function Family() {
  const { me, people } = useAuth()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    loadOthersItems(me.id)
      .then((items) => setCounts(countByOwner(items)))
      .catch(() => setCounts({}))
  }, [me.id])

  const isTopper = (p) => p.name === TREE_TOPPER
  const others = people
    .filter((p) => p.id !== me.id)
    .sort((a, b) => isTopper(b) - isTopper(a) || a.name.localeCompare(b.name))

  // Rows of 1, 2, 3... so the ornaments make a triangle like the tree.
  // A phone on its side is too short for that, so it gets two wide rows instead.
  const sideways = useMediaQuery(SIDEWAYS)
  const rows = []
  if (sideways) {
    const half = Math.ceil(others.length / 2)
    rows.push(others.slice(0, half), others.slice(half))
  } else {
    for (let i = 0, size = 1; i < others.length; i += size, size++) rows.push(others.slice(i, i + size))
  }

  // The tree sizes its ornaments from these so it always fits on screen
  const shape = { '--rows': rows.length, '--cols': Math.max(1, ...rows.map((r) => r.length)) }

  return (
    <div className="family-screen">
      <Hero title="Family" />
      <div className="page">
        <Notices />
        <div className="tree-wrap" style={shape}>
          <div className="tree">
            <img className="tree-photo" src={treePhoto} alt="" />
            {rows.map((row, r) => (
              <div key={r} className="tree-row">
                {row.map((person, i) => (
                  <Ornament
                    key={person.id}
                    person={person}
                    count={counts?.[person.id]}
                    loading={!counts}
                    style={ORNAMENT_STYLES[(r + i) % ORNAMENT_STYLES.length]}
                    delay={(r * 3 + i) % 4}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* After the tree so it falls in front of the tree photo, behind the ornaments */}
          <Snowfall />
        </div>
      </div>
    </div>
  )
}

function Ornament({ person, count, loading, style, delay }) {
  const total = count?.total ?? 0
  const taken = count?.taken ?? 0
  return (
    <Link to={`/person/${person.slug}`} className={`ornament ornament-${style}`} style={{ '--swing-delay': delay }}>
      <span className="ornament-string" aria-hidden="true" />
      <span className="ornament-cap" aria-hidden="true" />
      <span className="ornament-ball">
        <Photo src={person.photo_url} alt="" className="ornament-photo" />
      </span>
      <span className="ornament-tag">
        <span className="ornament-name">{person.name}</span>
        <span className="ornament-count">
          {loading ? null : total ? `${taken} of ${total} claimed` : 'No wishes yet'}
        </span>
      </span>
    </Link>
  )
}
