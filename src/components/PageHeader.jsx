import { useNavigate } from 'react-router-dom'
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
export default function PageHeader({ title, fallback = '/' }) {
  return (
    <div className="page-header">
      <BackButton fallback={fallback} />
      {title && <h1 className="page-header-title">{title}</h1>}
    </div>
  )
}
