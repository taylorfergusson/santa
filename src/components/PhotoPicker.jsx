import { useRef, useState } from 'react'
import { uploadPhoto } from '../items.js'
import Photo from './Photo.jsx'

// Thumbnails plus an "Add photos" button. Photos upload as soon as they're picked.
// With showCover, the first photo is labelled as the cover (items).
export default function PhotoPicker({ photos, onChange, showCover = false }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')

  const addFiles = async (files) => {
    setError('')
    setUploading(files.length)
    const added = []
    for (const file of files) {
      try {
        added.push(await uploadPhoto(file))
      } catch {
        setError("A photo couldn't be uploaded. Try a different one.")
      }
      setUploading((n) => n - 1)
    }
    onChange([...photos, ...added])
  }

  return (
    <div>
      <div className="photo-picker">
        {photos.map((src, i) => (
          <div key={src} className="photo-thumb">
            <Photo src={src} className="photo-thumb-img" />
            {showCover && i === 0 && <span className="photo-thumb-cover">Cover</span>}
            <button
              type="button"
              className="photo-thumb-remove"
              onClick={() => onChange(photos.filter((p) => p !== src))}
              aria-label="Remove photo"
            />
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`uploading-${i}`} className="photo-thumb photo-thumb-img photo-placeholder photo-thumb-loading">
            Uploading…
          </div>
        ))}
        <button type="button" className="photo-thumb photo-add" onClick={() => inputRef.current.click()}>
          + Add photos
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles([...e.target.files])
          e.target.value = ''
        }}
      />
    </div>
  )
}
