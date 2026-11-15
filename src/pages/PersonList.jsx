import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { loadList } from '../items.js'
import PageHeader from '../components/PageHeader.jsx'
import Hero from '../components/Hero.jsx'
import Photo from '../components/Photo.jsx'
import ItemGrid from '../components/ItemGrid.jsx'
import ItemCard from '../components/ItemCard.jsx'
import Questions from '../components/Questions.jsx'

// Someone else's wishlist, as a giver sees it: claim status on every card,
// claimed Exact items greyed out at the end of their group, secret ideas from
// family (hidden from the owner by the database), and anonymous questions.
export default function PersonList() {
  const { slug } = useParams()
  const { me, people } = useAuth()
  const person = people.find((p) => p.slug === slug)

  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!person || person.id === me.id) return
    setItems(null)
    loadList(person.id)
      .then(setItems)
      .catch(() => setError("Couldn't load the wishlist. Check your connection and try again."))
  }, [person, me.id])

  // Your own list always opens as the owner view, with no claim data
  if (person?.id === me.id) return <Navigate to="/me" replace />
  if (!person) {
    return (
      <div className="page">
        <PageHeader fallback="/family" />
        <p>Couldn't find that person.</p>
      </div>
    )
  }

  const ownItems = items?.filter((i) => !i.is_suggestion) ?? []
  const suggestions = items?.filter((i) => i.is_suggestion) ?? []

  return (
    <>
      <Hero back="/family" title={person.name} photo={<Photo src={person.photo_url} alt="" className="hero-photo" />} />
      <div className="page">
        {error && <p className="banner">{error}</p>}
        {items && !ownItems.length && <p className="empty">{person.name} hasn't added anything yet.</p>}

        <ItemGrid items={ownItems} showClaims />

        <section className="ideas">
          <h2 className="section-title">Secret ideas from family</h2>
          <p className="muted ideas-note">
            Think {person.name} would love something that's not on their wishlist? Add it here. {person.name} can't see
            these, but everyone else can.
          </p>
          {suggestions.length > 0 && (
            <div className="card-grid">
              {suggestions.map((item) => (
                <ItemCard key={item.id} item={item} showClaims />
              ))}
            </div>
          )}
          <Link to={`/add?for=${person.slug}&suggest=1`} className="btn btn-primary btn-large ideas-button">
            + Suggest an idea
          </Link>
        </section>

        <Questions profile={person} />
      </div>
    </>
  )
}
