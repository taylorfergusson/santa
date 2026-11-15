import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dismissNotices, loadNotices } from '../items.js'

// Quiet banner of unseen notices, e.g. "Laura removed "Socks" from their list.
// You'd already claimed it." Each one links to the item and can be dismissed.
export default function Notices() {
  const [notices, setNotices] = useState([])

  useEffect(() => {
    loadNotices()
      .then(setNotices)
      .catch(() => setNotices([]))
  }, [])

  const dismiss = (id) => {
    setNotices((all) => all.filter((n) => n.id !== id))
    dismissNotices({ id })
  }

  if (!notices.length) return null
  return (
    <ul className="notices">
      {notices.map((notice) => (
        <li key={notice.id} className="banner notice">
          <p className="notice-message">{notice.message}</p>
          <div className="notice-actions">
            {notice.item_id && (
              <Link to={`/item/${notice.item_id}`} className="btn-link">
                See it
              </Link>
            )}
            <button className="btn-link" onClick={() => dismiss(notice.id)}>
              Got it
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
