import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../supabase.js'
import { editedAfterClaim } from '../items.js'
import { GAG_GIFT } from '../config.js'
import Photo from '../components/Photo.jsx'
import Hero from '../components/Hero.jsx'

// Everyone brings a gag gift. The checkmarks are saved on this device only.
function GagGift({ userId }) {
  const key = `gag-gift-${userId}`
  const [done, setDone] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? []
    } catch {
      return []
    }
  })

  const toggle = (name) => {
    const next = done.includes(name) ? done.filter((n) => n !== name) : [...done, name]
    setDone(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // private browsing: it just won't be remembered
    }
  }

  return (
    <section className="gag-gift">
      <div className="gag-gift-head">
        <h2>🎭 Gag gift</h2>
        <p className="gag-gift-budget">Budget: {GAG_GIFT.budget}</p>
      </div>
      <ul className="shopping-rows">
        {GAG_GIFT.items.map((name) => {
          const bought = done.includes(name)
          return (
            <li key={name} className="shopping-row">
              <span className="shopping-item-name">{name}</span>
              <button
                className={`stage-button${bought ? ' bought' : ''}`}
                onClick={() => toggle(name)}
                aria-label={bought ? `${name}: bought. Tap to undo` : `${name}: tap to mark as bought`}
              >
                {bought ? '✓ Bought' : 'To buy'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Everything you've claimed, grouped by whose list it's on.
// Tap the stage to switch between Planning and Bought; tap the row to open the item.
export default function ShoppingList() {
  const { me, people } = useAuth()
  const [claims, setClaims] = useState(null)
  const [error, setError] = useState('')

  const load = () =>
    supabase
      .from('claims') // only your own claims are ever visible to you
      .select('id, stage, created_at, item:items(*)')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) return setError("Couldn't load your shopping list. Check your connection and try again.")
        setClaims(data.filter((c) => c.item))
      })

  useEffect(() => {
    load()
  }, [])

  const toggleStage = async (claim) => {
    const stage = claim.stage === 'bought' ? 'planning' : 'bought'
    setClaims((all) => all.map((c) => (c.id === claim.id ? { ...c, stage } : c))) // update right away
    const { error } = await supabase.from('claims').update({ stage }).eq('id', claim.id)
    if (error) {
      setError("That didn't save. Check your connection and try again.")
      load()
    }
  }

  if (!claims) {
    return (
      <>
        <Hero title="Shopping list" />
        <div className="page">{error && <p className="banner">{error}</p>}</div>
      </>
    )
  }

  const bought = claims.filter((c) => c.stage === 'bought').length
  const toBuy = claims.length - bought
  const groups = people
    .map((person) => ({ person, claims: claims.filter((c) => c.item.owner_id === person.id) }))
    .filter((g) => g.claims.length)

  return (
    <>
      <Hero title="Shopping list">
        {claims.length > 0 && (
          <p className="shopping-count">
            {claims.length} {claims.length === 1 ? 'gift' : 'gifts'}: {bought} bought, {toBuy} to buy
          </p>
        )}
      </Hero>
      <div className="page">
        {error && <p className="banner">{error}</p>}

        <GagGift userId={me.id} />

        {!claims.length && (
          <p className="empty">
            Nothing here yet. Open someone's list from the Family tab and tap "I'll get this" on something.
          </p>
        )}

        {groups.map(({ person, claims }) => (
          <section key={person.id} className="shopping-group">
            <Link to={`/person/${person.slug}`} className="shopping-person">
              <Photo src={person.photo_url} alt="" className="shopping-person-photo" />
              <h2>{person.name}</h2>
            </Link>
            <ul className="shopping-rows">
              {claims.map((claim) => (
                <li key={claim.id} className="shopping-row">
                  <Link to={`/item/${claim.item.id}`} className="shopping-item">
                    <Photo src={claim.item.photos[0]} className="shopping-item-photo" />
                    <span>
                      <span className="shopping-item-name">{claim.item.name}</span>
                      {claim.item.deleted_at ? (
                        <span className="shopping-note">Removed from their list</span>
                      ) : (
                        editedAfterClaim(claim.item, claim.created_at) && (
                          <span className="shopping-note">Updated after you claimed it</span>
                        )
                      )}
                    </span>
                  </Link>
                  <button
                    className={`stage-button${claim.stage === 'bought' ? ' bought' : ''}`}
                    onClick={() => toggleStage(claim)}
                    aria-label={
                      claim.stage === 'bought' ? 'Bought. Tap to mark as planning' : 'Planning. Tap to mark as bought'
                    }
                  >
                    {claim.stage === 'bought' ? '✓ Bought' : 'Planning'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
