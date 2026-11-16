import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { loadOthersItems, loadWaitingQuestions } from '../items.js'
import Hero from '../components/Hero.jsx'
import FeedPost from '../components/FeedPost.jsx'
import Notices from '../components/Notices.jsx'
import Countdown from '../components/Countdown.jsx'
import Raffle from '../components/Raffle.jsx'
import { WaitingQuestions } from '../components/Questions.jsx'

const POST_COUNT = 10 // posts shown in the feed
const GROUP_HOURS = 3 // items one person adds within this many hours become one post

// Turns the newest-first item list into posts. Back-to-back items from the same
// person, added close together, are grouped (e.g. an Amazon import).
function toPosts(items) {
  const posts = []
  for (const item of items) {
    const last = posts[posts.length - 1]
    const closeTogether =
      last && new Date(last.items[0].created_at) - new Date(item.created_at) < GROUP_HOURS * 3600000
    if (last && last.ownerId === item.owner_id && closeTogether) last.items.push(item)
    else posts.push({ ownerId: item.owner_id, items: [item] })
  }
  return posts
}

// Home: any notices, the Christmas countdown, the Cardi raffle, any questions waiting for your answer, then a feed of
// what everyone else has added lately.
export default function Home() {
  const { me, managed, people } = useAuth()
  const [items, setItems] = useState(null)
  const [waiting, setWaiting] = useState(null) // unanswered questions on you + managed profiles
  const [error, setError] = useState('')

  const profileIds = [me.id, ...managed.map((p) => p.id)].join(',')
  const loadWaiting = () =>
    loadWaitingQuestions(profileIds.split(','))
      .catch(() => [])
      .then(setWaiting)

  useEffect(() => {
    loadWaiting()
  }, [profileIds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOthersItems(me.id)
      .then(setItems)
      .catch(() => setError("Couldn't load everything. Check your connection and try again."))
  }, [me.id])

  const personOf = (id) => people.find((p) => p.id === id)
  const posts = items ? toPosts(items).slice(0, POST_COUNT) : []

  return (
    <>
      <Hero title={`Hi ${me.name}!`} />
      <div className="page">
        <Notices />
        <Countdown />
        <Raffle />
        {waiting?.length > 0 && <WaitingQuestions questions={waiting} onChange={loadWaiting} />}
        {error && <p className="banner">{error}</p>}
        {items && !items.length && <p className="empty">Nobody has added anything yet.</p>}
        {posts.length > 0 && (
          <section className="feed">
            <h2 className="section-title">Newly added</h2>
            {posts.map((post) => (
              <FeedPost key={post.items[0].id} person={personOf(post.ownerId)} items={post.items} />
            ))}
            <div className="center-row">
              <Link to="/family" className="btn btn-secondary btn-large">
                See everyone
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
