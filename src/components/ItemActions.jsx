import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { EditIcon, TrashIcon } from './Icons.jsx'

// Edit and Delete buttons side by side. Delete asks "Delete it?" first.
// Used under each card on My list and on the item page.
// onDeleted runs after a successful delete (reload the list, or leave the page).
export default function ItemActions({ item, onDeleted, large = false }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const size = large ? ' item-actions-large' : ''

  const remove = async () => {
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('delete_item', { target_item: item.id })
    setBusy(false)
    if (error) return setError("Couldn't delete. Try again.")
    onDeleted()
  }

  if (confirming) {
    return (
      <div className={`item-actions item-actions-confirm${size}`}>
        <p className="item-actions-question">Delete “{item.name}”?</p>
        <div className="item-actions-row">
          <button className="item-action item-action-danger" onClick={remove} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
          <button className="item-action" onClick={() => setConfirming(false)} disabled={busy}>
            Keep
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`item-actions${size}`}>
      <div className="item-actions-row">
        <Link to={`/item/${item.id}/edit`} className="item-action">
          <EditIcon /> Edit
        </Link>
        <button className="item-action item-action-danger" onClick={() => setConfirming(true)}>
          <TrashIcon /> Delete
        </button>
      </div>
    </div>
  )
}
