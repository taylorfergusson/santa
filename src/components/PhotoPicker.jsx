import { useEffect, useRef, useState } from 'react'
import { uploadPhoto } from '../items.js'
import Photo from './Photo.jsx'

// Only image files from a file picker, drop or paste
const imagesOnly = (files) => [...files].filter((f) => f.type.startsWith('image/'))

// Thumbnails plus an "Add photos" button. Photos upload as soon as they're picked.
// Images can also be dragged onto the photos, or pasted.
// With showCover, the first photo is labelled as the cover (items).
// With pasteAnywhere, pasting an image anywhere on the page adds it (the item form).
// Without it, pasting only works while typing in the box next to the photos (e.g. a question).
export default function PhotoPicker({ photos, onChange, showCover = false, pasteAnywhere = false }) {
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const [uploading, setUploading] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  // Keep the latest photos and onChange for the paste listener and slow uploads
  const latest = useRef({ photos, onChange })
  latest.current = { photos, onChange }

  const addFiles = async (files) => {
    files = imagesOnly(files)
    if (!files.length) return
    setError('')
    setUploading((n) => n + files.length)
    const added = []
    for (const file of files) {
      try {
        added.push(await uploadPhoto(file))
      } catch {
        setError("A photo couldn't be uploaded. Try a different one.")
      }
      setUploading((n) => n - 1)
    }
    latest.current.onChange([...latest.current.photos, ...added])
  }

  // Paste an image (e.g. a copied screenshot). Pasting plain text still works as normal.
  useEffect(() => {
    const onPaste = (e) => {
      const files = imagesOnly(e.clipboardData?.files ?? [])
      if (!files.length) return
      const box = wrapRef.current?.parentElement
      if (!pasteAnywhere && !(box && box.contains(e.target))) return
      e.preventDefault()
      addFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteAnywhere])

  return (
    <div
      ref={wrapRef}
      className={dragging ? 'photo-picker-drop' : undefined}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        addFiles(e.dataTransfer.files)
      }}
    >
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
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
