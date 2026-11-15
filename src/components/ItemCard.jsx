import { Link } from 'react-router-dom'
import Photo from './Photo.jsx'
import { claimInfo } from '../items.js'

// Marketplace-style card: photo, name and (for givers) claim status.
// Most things are Flexible, so only Exact items get a badge (top left of the photo).
// owner shows whose wishlist it's on as a little face in the top right (used on Home).
export default function ItemCard({ item, showClaims, owner }) {
  const claim = showClaims ? claimInfo(item) : { text: '', dimmed: false }
  return (
    <Link to={`/item/${item.id}`} className={`card${claim.dimmed ? ' dimmed' : ''}`}>
      <div className="card-photo-frame">
        <Photo src={item.photos[0]} className="card-photo" />
        {item.type === 'exact' && <span className="tag tag-exact card-badge">Exact</span>}
        {owner && <Photo src={owner.photo_url} alt={`${owner.name}'s wishlist`} className="card-avatar" />}
      </div>
      <div className="card-name">{item.name}</div>
      {item.is_suggestion && (
        <div className="card-meta">
          <span className="tag tag-idea">Idea</span>
        </div>
      )}
      {claim.text && <div className="card-status">{claim.text}</div>}
    </Link>
  )
}
