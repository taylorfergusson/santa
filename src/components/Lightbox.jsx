import { useEffect } from 'react'

// A photo shown full screen, like Facebook. Tap anywhere (or press Escape) to close.
export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])

  if (!src) return null
  return (
    <div className="lightbox" role="dialog" aria-label="Photo" onClick={onClose}>
      <img src={src} alt="" className="lightbox-photo" />
      <button className="lightbox-close" aria-label="Close">
        ×
      </button>
    </div>
  )
}
