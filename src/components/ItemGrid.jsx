import ItemCard from './ItemCard.jsx'
import { PRIORITIES, claimInfo } from '../items.js'

// Items grouped by priority (NEED SO BAD, want, nice to have), each group a card grid.
// With showClaims, Exact items someone else is getting sort to the end of their group.
export default function ItemGrid({ items, showClaims = false }) {
  return PRIORITIES.map(({ value, label }) => {
    let group = items.filter((i) => i.priority === value)
    if (!group.length) return null
    if (showClaims) {
      group = [...group].sort((a, b) => claimInfo(a).dimmed - claimInfo(b).dimmed)
    }
    return (
      <section key={value} className="priority-group">
        <h2 className="section-title">{label}</h2>
        <div className="card-grid">
          {group.map((item) => (
            <ItemCard key={item.id} item={item} showClaims={showClaims} />
          ))}
        </div>
      </section>
    )
  })
}
