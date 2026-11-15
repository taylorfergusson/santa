import ItemCard from './ItemCard.jsx'
import { PRIORITIES, claimInfo } from '../items.js'

// Items grouped by priority (NEED SO BAD, want, nice to have), each group a card grid.
// With showClaims, Exact items someone else is getting sort to the end of their group.
// onDeleted adds Edit and Delete buttons under each card.
export default function ItemGrid({ items, showClaims = false, onDeleted }) {
  return PRIORITIES.map(({ value, heading }) => {
    let group = items.filter((i) => i.priority === value)
    if (!group.length) return null
    if (showClaims) {
      group = [...group].sort((a, b) => claimInfo(a).dimmed - claimInfo(b).dimmed)
    }
    return (
      <section key={value} className={`priority-group priority-${value}`}>
        <h2 className="section-title">{heading}</h2>
        <div className="card-grid">
          {group.map((item) => (
            <ItemCard key={item.id} item={item} showClaims={showClaims} onDeleted={onDeleted} />
          ))}
        </div>
      </section>
    )
  })
}
