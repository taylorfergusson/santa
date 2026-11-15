import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../supabase.js'
import {
  canEditItem,
  claimInfo,
  dismissNotices,
  editedAfterClaim,
  isUrl,
  linkLabel,
  loadItem,
  priorityLabel,
} from '../items.js'
import PageHeader from '../components/PageHeader.jsx'
import PhotoCarousel from '../components/PhotoCarousel.jsx'

// One item: photos, details and one main action.
//   Your own list: Edit
//   Anyone else's list (incl. a profile you manage): the claim button
export default function ItemDetail() {
  const { id } = useParams()
  const { me, people } = useAuth()
  const [item, setItem] = useState(undefined) // undefined = loading, null = not found
  const [error, setError] = useState('')

  const [claimedAt, setClaimedAt] = useState(null) // when you claimed it, if you did

  const reload = () =>
    Promise.all([loadItem(id), supabase.from('claims').select('created_at').eq('item_id', id).maybeSingle()])
      .then(([item, { data: claim }]) => {
        setItem(item)
        setClaimedAt(claim?.created_at ?? null)
      })
      .catch(() => setError('Couldn\'t load this item. Check your connection and try again.'))

  useEffect(() => {
    reload()
    dismissNotices({ itemId: id }) // opening the item counts as seeing its notices
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Message text={error} />
  if (item === undefined) return null
  if (item === null || (item.deleted_at && !item.status?.my_stage)) {
    return <Message text="This item isn't on the list anymore." />
  }

  const owner = people.find((p) => p.id === item.owner_id)
  const isOwnList = item.owner_id === me.id
  const canEdit = canEditItem(item, me, owner)
  const claim = claimInfo(item)
  const listLink = isOwnList ? '/me' : owner?.managed_by.includes(me.id) ? `/me?for=${owner.slug}` : `/person/${owner?.slug}`

  return (
    <div className="page item-page">
      <PageHeader fallback={listLink} />
      <PhotoCarousel photos={item.photos} />

      <div className="item-body">
        <h1 className="item-name">{item.name}</h1>
        <div className="item-meta">
          {item.type === 'exact' && <span className="tag tag-exact">Exact</span>}
          <span className="item-priority">{priorityLabel(item.priority)}</span>
          {!isOwnList && owner && <span className="muted">· {owner.name}'s wishlist</span>}
        </div>
        {item.is_suggestion && <p className="muted">An idea from family. {owner?.name} can't see this.</p>}
        {item.deleted_at && <p className="banner">This was removed from the wishlist after you claimed it.</p>}
        {!item.deleted_at && item.status?.my_stage && editedAfterClaim(item, claimedAt) && (
          <p className="banner">Updated after you claimed it. Check the details below.</p>
        )}
        {claim.text && <p className="item-claim">{claim.text}</p>}

        {!isOwnList && <ClaimActions item={item} onChange={reload} />}
        {canEdit && (
          <Link to={`/item/${item.id}/edit`} className={`btn btn-block btn-large${isOwnList ? ' btn-primary' : ''}`}>
            Edit
          </Link>
        )}

        {item.type === 'exact' ? <ExactDetails item={item} /> : <FlexibleDetails item={item} isOwnList={isOwnList} />}

        {item.notes && (
          <Detail label="Notes">
            <p className="pre-wrap">{item.notes}</p>
          </Detail>
        )}
      </div>
    </div>
  )
}

// The main button, which changes with the claim state:
//   Available                       -> I'll get this
//   You're planning                 -> Mark as bought  (+ I changed my mind)
//   You bought it                   -> "You got this"  (+ Undo)
//   Exact, someone else is getting  -> disabled "Someone's getting this"
//   Flexible, others are getting    -> I'll get one too
function ClaimActions({ item, onChange }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const myStage = item.status?.my_stage
  const othersClaimed = (item.status?.claim_count ?? 0) > (myStage ? 1 : 0)

  const act = async (request) => {
    setBusy(true)
    setMessage('')
    const { error } = await request
    if (error?.code === 'FEU01') setMessage('Someone just claimed this.')
    else if (error?.code === 'FEU03') setMessage('This item isn\'t on the list anymore.')
    else if (error) setMessage('That didn\'t work. Check your connection and try again.')
    await onChange()
    setBusy(false)
  }

  const claims = supabase.from('claims')
  // Only your own claim is visible to you, so these only ever touch yours
  const claim = () => act(claims.insert({ item_id: item.id }))
  const setStage = (stage) => act(claims.update({ stage }).eq('item_id', item.id))
  const release = () => act(claims.delete().eq('item_id', item.id))

  let buttons
  if (myStage === 'planning') {
    buttons = (
      <>
        <button className="btn btn-primary btn-block btn-large" onClick={() => setStage('bought')} disabled={busy}>
          Mark as bought
        </button>
        <button className="btn-link" onClick={release} disabled={busy}>I changed my mind</button>
      </>
    )
  } else if (myStage === 'bought') {
    buttons = (
      <>
        <p className="claim-done">You got this</p>
        <button className="btn-link" onClick={() => setStage('planning')} disabled={busy}>Undo</button>
      </>
    )
  } else if (item.deleted_at) {
    buttons = null
  } else if (item.type === 'exact' && othersClaimed) {
    buttons = <button className="btn btn-block btn-large" disabled>Someone's getting this</button>
  } else {
    buttons = (
      <button className="btn btn-primary btn-block btn-large" onClick={claim} disabled={busy}>
        {othersClaimed ? 'I\'ll get one too' : 'I\'ll get this'}
      </button>
    )
  }

  return (
    <div className="claim-actions">
      {buttons}
      {message && <p className="field-error" role="alert">{message}</p>}
    </div>
  )
}

function ExactDetails({ item }) {
  const facts = [['Size', item.size], ['Colour', item.colour], ['Variant', item.variant]].filter(([, v]) => v)
  return (
    <>
      {item.links.length > 0 && (
        <div className="link-buttons">
          {item.links.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-block btn-large">
              View at {linkLabel(url)}
            </a>
          ))}
        </div>
      )}
      {facts.length > 0 && (
        <dl className="facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}

function FlexibleDetails({ item, isOwnList }) {
  return (
    <>
      {item.likes && (
        <Detail label={isOwnList ? 'What I like about it' : 'What they like about it'}>
          <p className="pre-wrap">{item.likes}</p>
        </Detail>
      )}
      {item.example_links.length > 0 && (
        <Detail label="Examples">
          <ul className="example-list">
            {item.example_links.map((entry) => (
              <li key={entry}>
                {isUrl(entry) ? <a href={entry} target="_blank" rel="noreferrer">{linkLabel(entry)}</a> : entry}
              </li>
            ))}
          </ul>
        </Detail>
      )}
    </>
  )
}

function Detail({ label, children }) {
  return (
    <section className="detail">
      <h2 className="detail-label">{label}</h2>
      {children}
    </section>
  )
}

function Message({ text }) {
  return (
    <div className="page">
      <PageHeader fallback="/" />
      <p>{text}</p>
    </div>
  )
}
