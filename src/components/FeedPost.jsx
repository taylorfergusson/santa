import { Link } from 'react-router-dom'
import Photo from './Photo.jsx'
import Snowfall from './Snowfall.jsx'
import { ShoppingIcon, MyListIcon } from './Icons.jsx'
import { claimInfo, priorityLabel } from '../items.js'

// One post in the Home feed, like a Marketplace listing on Facebook's home feed:
// who added it and when, then the photo, then the item. Several items added
// close together by the same person become one post with a photo collage.
export default function FeedPost({ person, items }) {
  const first = items[0]
  const single = items.length === 1
  const listLink = `/person/${person?.slug}`

  return (
    <article className="post">
      <header className="post-header">
        <Link to={listLink} className="post-avatar-link" aria-label={`${person?.name}'s wishlist`}>
          <Photo src={person?.photo_url} className="post-avatar" />
        </Link>
        <div className="post-byline">
          <p className="post-who">
            <Link to={listLink} className="post-name">
              {person?.name}
            </Link>{' '}
            {single ? 'added to their wishlist' : `added ${items.length} items to their wishlist`}
          </p>
          <p className="post-when">
            {timeAgo(first.created_at)}
            {single && <> · {priorityLabel(first.priority)}</>}
          </p>
        </div>
      </header>

      {single ? <SingleItem item={first} /> : <Collage items={items} />}

      <footer className="post-actions">
        <Link to={single ? `/item/${first.id}` : listLink} className="post-action">
          <ShoppingIcon /> {single ? 'See item' : 'See items'}
        </Link>
        <Link to={listLink} className="post-action">
          <MyListIcon /> {person?.name}'s list
        </Link>
      </footer>
    </article>
  )
}

function SingleItem({ item }) {
  const claim = claimInfo(item)
  return (
    <Link to={`/item/${item.id}`} className={`post-item${claim.dimmed ? ' dimmed' : ''}`}>
      <div className="post-photo-frame">
        <Photo src={item.photos[0]} className="post-photo" />
        <Snowfall className="card-snow" />
        {item.type === 'exact' && <span className="tag tag-exact card-badge">Exact</span>}
      </div>
      <div className="post-item-text">
        <div className="post-item-name">{item.name}</div>
        {claim.text && <div className="card-status">{claim.text}</div>}
      </div>
    </Link>
  )
}

// Up to 4 photos in a grid; the last tile says "+3" if there are more
function Collage({ items }) {
  const shown = items.slice(0, 4)
  const extra = items.length - shown.length
  return (
    <div className={`post-collage post-collage-${shown.length}`}>
      {shown.map((item, i) => (
        <Link key={item.id} to={`/item/${item.id}`} className="post-tile">
          <Photo src={item.photos[0]} className="post-tile-photo" />
          <span className="post-tile-name">{item.name}</span>
          {extra > 0 && i === shown.length - 1 && <span className="post-tile-more">+{extra}</span>}
        </Link>
      ))}
    </div>
  )
}

// "Just now", "5m", "3h", "Yesterday", "4d", then "Nov 12"
function timeAgo(date) {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
