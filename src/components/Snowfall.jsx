// Realistic falling snow: three depth layers (far, mid, near). Styles in app.css,
// flake sizes and speeds in theme.css. Drop it inside any element with position: relative.
// className="card-snow" makes it the hover-only version used on item cards.
export default function Snowfall({ className = '' }) {
  return (
    <span className={`snowfall ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}
