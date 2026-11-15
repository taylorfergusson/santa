// A photo, or a grey placeholder box when there isn't one.
export default function Photo({ src, alt = '', className = '' }) {
  if (!src) return <div className={`${className} photo-placeholder`} role="img" aria-label={alt} />
  return <img src={src} alt={alt} className={className} />
}
