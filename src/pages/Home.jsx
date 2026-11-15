import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { SITE_TITLE } from '../config.js'
import { loadOthersItems } from '../items.js'
import Hero from '../components/Hero.jsx'
import ItemCard from '../components/ItemCard.jsx'
import Notices from '../components/Notices.jsx'

const RECENT_COUNT = 6

// Home: any notices, then the newest items on everyone else's lists.
export default function Home() {
  const { me, people } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOthersItems(me.id)
      .then((others) => setData({ others }))
      .catch(() => setError("Couldn't load everything. Check your connection and try again."))
  }, [me.id])

  const personOf = (id) => people.find((p) => p.id === id)

  return (
    <>
      <Hero eyebrow={SITE_TITLE} title={`Hi ${me.name}!`} />
      <div className="page">
        <Notices />
        {error && <p className="banner">{error}</p>}
        {data && (
          <>
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
