import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, logOut } from '../auth.jsx'
import { loadList } from '../items.js'
import ItemGrid from '../components/ItemGrid.jsx'
import ItemCard from '../components/ItemCard.jsx'
import Hero from '../components/Hero.jsx'
import Questions from '../components/Questions.jsx'

// Your own wishlist. Managers (Jenn and Jordan) get a toggle to switch to the
// profiles they manage; those lists show claims and suggestions like a giver view.
export default function MyList() {
  const { me, managed } = useAuth()
  const [params, setParams] = useSearchParams()
  const profile = managed.find((p) => p.slug === params.get('for')) ?? me
  const isManaged = profile.id !== me.id

  const [items, setItems] = useState(null)
  const [waiting, setWaiting] = useState(0)
  const [error, setError] = useState('')

  const reload = () =>
    loadList(profile.id)
      .then(setItems)
      .catch(() => setError("Couldn't load the wishlist. Check your connection and try again."))

  useEffect(() => {
    setItems(null)
    setError('')
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const ownItems = items?.filter((i) => !i.is_suggestion) ?? []
  const suggestions = items?.filter((i) => i.is_suggestion) ?? []
  const addLink = isManaged ? `/add?for=${profile.slug}` : '/add'

  return (
    <>
      <Hero title={isManaged ? `${profile.name}'s Wishlist` : 'My Wishlist'}>
        {managed.length > 0 && (
          <div className="toggle" role="tablist">
            {[me, ...managed].map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === profile.id}
                className={`toggle-option${p.id === profile.id ? ' selected' : ''}`}
                onClick={() => setParams(p.id === me.id ? {} : { for: p.slug }, { replace: true })}
              >
                {p.id === me.id ? 'My Wishlist' : `${p.name}'s Wishlist`}
              </button>
            ))}
          </div>
        )}

        <div className="action-row">
          <Link to={addLink} className="btn btn-primary btn-large">
            + Add item
          </Link>
          {waiting > 0 && (
            <a href="#questions" className="hero-pill" onClick={scrollToQuestions}>
              {waiting} {waiting === 1 ? 'question' : 'questions'} waiting
            </a>
          )}
        </div>
      </Hero>
      <div className="page">
        {error && <p className="banner">{error}</p>}
        {items && !ownItems.length && (
          <p className="empty">
            {isManaged ? `${profile.name}'s wishlist is empty.` : 'Your wishlist is empty.'} Tap "+ Add item" to start.
          </p>
        )}

        <ItemGrid items={ownItems} showClaims={isManaged} onDeleted={reload} />

        {isManaged && suggestions.length > 0 && (
          <section className="priority-group">
            <h2 className="section-title">Secret ideas from family</h2>
            <div className="card-grid">
              {suggestions.map((item) => (
                <ItemCard key={item.id} item={item} showClaims />
              ))}
            </div>
          </section>
        )}

        <Questions profile={profile} onLoad={(list) => setWaiting(list.filter((q) => !q.answer).length)} />

        <div className="logout">
          <button className="btn-link" onClick={logOut}>
            Log out
          </button>
        </div>
        {/* Icons8's free licence asks for this link */}
        <p className="credit">
          <a href="https://icons8.com" target="_blank" rel="noreferrer">
            Icons by Icons8
          </a>
        </p>
      </div>
    </>
  )
}

// Hash routing uses the URL hash, so scroll by hand instead of following #questions
function scrollToQuestions(e) {
  e.preventDefault()
  document.getElementById('questions')?.scrollIntoView({ behavior: 'smooth' })
}
