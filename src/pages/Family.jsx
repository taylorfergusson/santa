import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { countByOwner, loadOthersItems } from '../items.js'
import Photo from '../components/Photo.jsx'
import Hero from '../components/Hero.jsx'
import treePhoto from '../assets/tree.webp'
import Notices from '../components/Notices.jsx'

// Ornament colours cycle so neighbours look different
const ORNAMENT_STYLES = ['gold', 'red', 'silver', 'green']

// Everyone except you, alphabetically, as photo ornaments on a Christmas tree.
// Each ornament shows how many wishes they have and how many someone has claimed.
export default function Family() {
  const { me, people } = useAuth()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    loadOthersItems(me.id)
      .then((items) => setCounts(countByOwner(items)))
      .catch(() => setCounts({}))
  }, [me.id])

  const others = people.filter((p) => p.id !== me.id).sort((a, b) => a.name.localeCompare(b.name))

  // Rows of 1, 2, 3... so the ornaments make a triangle like the tree
  const rows = []
  for (let i = 0, size = 1; i < others.length; i += size, size++) rows.push(others.slice(i, i + size))

  return (
    <>
      <Hero title="Family" />
      <div className="page">
        <Notices />
        <div className="tree-wrap">
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
        </div>
      </div>
    </>
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
        {!loading && (
          <span className="ornament-count">
            {total ? (
              <>
                {total} {total === 1 ? 'wish' : 'wishes'}
                <br />
                {taken} claimed
              </>
            ) : (
              'No wishes yet'
            )}
          </span>
        )}
      </span>
    </Link>
  )
}
