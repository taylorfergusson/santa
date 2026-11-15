import { Link, useNavigate } from 'react-router-dom'
import Photo from './Photo.jsx'
import { BackIcon } from './Icons.jsx'

// Goes back if there's somewhere to go back to, otherwise to `fallback`
// (e.g. a link opened directly).
export function useGoBack(fallback = '/') {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback, { replace: true }))
}

export function BackButton({ fallback }) {
  const goBack = useGoBack(fallback)
  return (
    <button className="back-button" onClick={goBack} aria-label="Back">
      <BackIcon />
    </button>
  )
}

// Back arrow at the top left, like Marketplace, with an optional title.
// `place` shows where you are, centred at the top (e.g. "Jordan's Wishlist"
// with their photo): { label, photo, to }. Tapping it goes to that list.
export default function PageHeader({ title, fallback = '/', place }) {
  if (place) {
    return (
      <div className="page-header page-header-place">
        <BackButton fallback={fallback} />
        <Link to={place.to} className="place">
          {place.photo !== undefined && <Photo src={place.photo} className="place-photo" />}
          <span className="place-label">{place.label}</span>
        </Link>
        <span aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className="page-header">
      <BackButton fallback={fallback} />
      {title && <h1 className="page-header-title">{title}</h1>}
    </div>
  )
}
