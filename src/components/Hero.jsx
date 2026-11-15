import Snowfall from './Snowfall.jsx'
import { BackButton } from './PageHeader.jsx'

// Red banner with gently falling snow at the top of the main screens.
// `back` shows a back arrow (pass the fallback path); children go under the title.
export default function Hero({ eyebrow, title, back, photo, children }) {
  return (
    <header className="hero">
      <Snowfall />
      <div className="hero-inner">
        {back && <BackButton fallback={back} />}
        <div className="hero-heading">
          {photo}
          <div>
            {eyebrow && <p className="hero-eyebrow">{eyebrow}</p>}
            <h1 className="hero-title">{title}</h1>
          </div>
        </div>
        {children}
      </div>
    </header>
  )
}
