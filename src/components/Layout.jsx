import { NavLink, Outlet } from 'react-router-dom'
import { HomeIcon, FamilyIcon, PlusIcon, ShoppingIcon, MyListIcon } from './Icons.jsx'
import { SITE_TITLE } from '../config.js'

// Five tabs: icons with labels underneath,
// and a round + in the middle for adding to your wishlist.
const TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/family', label: 'Family', Icon: FamilyIcon },
  { to: '/add', label: 'Add to my wishlist', Icon: PlusIcon, add: true },
  { to: '/shopping', label: 'Shopping list', Icon: ShoppingIcon },
  { to: '/me', label: 'My Wishlist', Icon: MyListIcon },
]

function NavLinks() {
  return TABS.map(({ to, label, Icon, add }) => (
    <NavLink key={to} to={to} end={to === '/'} className={`nav-link${add ? ' nav-add' : ''}`} aria-label={label}>
      <span className="nav-icon">
        <Icon />
      </span>
      <span className="nav-label">{label}</span>
    </NavLink>
  ))
}

// Bottom tab bar on phones and tablets, left sidebar on desktop (CSS decides which shows).
export default function Layout() {
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-title">{SITE_TITLE}</div>
        <NavLinks />
      </nav>
      <main>
        <Outlet />
      </main>
      <nav className="tab-bar">
        <NavLinks />
      </nav>
    </div>
  )
}
