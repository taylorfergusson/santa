import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../supabase.js'
import { SITE_TITLE } from '../config.js'
import { countByOwner, countWaitingQuestions, loadOthersItems } from '../items.js'
import Hero from '../components/Hero.jsx'
import ItemCard from '../components/ItemCard.jsx'
import Notices from '../components/Notices.jsx'

const RECENT_COUNT = 6

// Overview of everything: your wishlist, your shopping, the family, and what's new.
export default function Home() {
  const { me, managed, people } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('owner_id', me.id).is('deleted_at', null),
      supabase.from('claims').select('stage'),
      countWaitingQuestions([me.id, ...managed.map((p) => p.id)]),
      loadOthersItems(me.id),
    ])
      .then(([mine, claims, waiting, others]) =>
        setData({ myCount: mine.count ?? 0, claims: claims.data ?? [], waiting, others }),
      )
      .catch(() => setError("Couldn't load everything. Check your connection and try again."))
  }, [me.id, managed])

  const personOf = (id) => people.find((p) => p.id === id)
  const bought = data?.claims.filter((c) => c.stage === 'bought').length ?? 0
  const toBuy = (data?.claims.length ?? 0) - bought
  const familyCounts = data ? Object.values(countByOwner(data.others)) : []
  const stillNeeded = familyCounts.reduce((sum, c) => sum + c.total - c.taken, 0)

  return (
    <>
      <Hero eyebrow={SITE_TITLE} title={`Hi ${me.name}!`} />
      <div className="page">
        <Notices />
        {error && <p className="banner">{error}</p>}
        {data && (
          <>
            <div className="stat-grid">
              <Link to="/me" className="stat">
                <span className="stat-label">My Wishlist</span>
                <span className="stat-value">{data.myCount}</span>
                <span className="stat-detail">
                  {data.waiting
                    ? `${data.waiting} ${data.waiting === 1 ? 'question' : 'questions'} waiting`
                    : data.myCount === 1
                      ? 'wish'
                      : 'wishes'}
                </span>
              </Link>
              <Link to="/shopping" className="stat">
                <span className="stat-label">Shopping list</span>
                <span className="stat-value">{data.claims.length}</span>
                <span className="stat-detail">
                  {data.claims.length ? `${bought} bought, ${toBuy} to buy` : 'nothing yet'}
                </span>
              </Link>
              <Link to="/family" className="stat">
                <span className="stat-label">Family</span>
                <span className="stat-value">{stillNeeded}</span>
                <span className="stat-detail">{stillNeeded === 1 ? 'wish still open' : 'wishes still open'}</span>
              </Link>
            </div>

            {data.others.length > 0 && (
              <section>
                <h2 className="section-title">Newly added</h2>
                <div className="card-grid">
                  {data.others.slice(0, RECENT_COUNT).map((item) => (
                    <ItemCard key={item.id} item={item} showClaims owner={personOf(item.owner_id)} />
                  ))}
                </div>
                <div className="center-row">
                  <Link to="/family" className="btn btn-secondary btn-large">
                    See everyone
                  </Link>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
