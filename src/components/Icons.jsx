import homeGlyph from '../assets/icons/home.png'
import familyGlyph from '../assets/icons/family.png'
import shoppingGlyph from '../assets/icons/shopping.png'
import wishlistGlyph from '../assets/icons/wishlist.png'

// Nav icons: Icons8 "iOS Glyph" PNGs used as a mask, so they take the text colour
// (red when active). To swap one, replace its PNG in src/assets/icons.
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

export function PlusIcon() {
  return (
    <svg {...svgProps} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
