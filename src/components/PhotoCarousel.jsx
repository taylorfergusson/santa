import { useState } from 'react'
import Photo from './Photo.jsx'
import Lightbox from './Lightbox.jsx'

// Big swipeable photo area for item pages. Tap a photo to see it full screen.
// Grey box when there are no photos.
export default function PhotoCarousel({ photos }) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(null)
  if (!photos.length) return <Photo className="carousel-photo" />

  const onScroll = (e) => {
    const el = e.currentTarget
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="carousel">
      <div className="carousel-track" onScroll={onScroll}>
        {photos.map((src) => (
          <button key={src} className="carousel-button" onClick={() => setOpen(src)} aria-label="Open photo">
            <Photo src={src} className="carousel-photo" />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="carousel-dots">
          {photos.map((src, i) => (
            <span key={src} className={`carousel-dot${i === index ? ' active' : ''}`} />
          ))}
        </div>
      )}
      <Lightbox src={open} onClose={() => setOpen(null)} />
    </div>
  )
}
