import homeGlyph from '../assets/icons/home.png'
import familyGlyph from '../assets/icons/family.png'
import shoppingGlyph from '../assets/icons/shopping.png'
import wishlistGlyph from '../assets/icons/wishlist.png'

// Nav icons: Icons8 "iOS Glyph" PNGs used as a mask, so they take the text colour
// (evergreen when active). To swap one, replace its PNG in src/assets/icons.
const glyph = (src) =>
  function Glyph() {
    return <span className="glyph" style={{ '--glyph': `url(${src})` }} aria-hidden="true" />
  }

export const HomeIcon = glyph(homeGlyph) // gingerbread house
export const FamilyIcon = glyph(familyGlyph) // Christmas tree
export const ShoppingIcon = glyph(shoppingGlyph) // Christmas gift
export const MyListIcon = glyph(wishlistGlyph) // wish list

// Simple line icons. They use currentColor, so they follow the theme.
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function BackIcon() {
  return (
    <svg {...svgProps}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function DeleteIcon() {
  return (
    <svg {...svgProps}>
      <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7z" />
      <path d="M12 9l6 6M18 9l-6 6" />
    </svg>
  )
}

export function EditIcon() {
  return (
    <svg {...svgProps}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...svgProps}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg {...svgProps} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
