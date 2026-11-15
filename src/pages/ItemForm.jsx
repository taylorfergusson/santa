import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../supabase.js'
import { PRIORITIES, TYPES, canEditItem, loadItem, normalizeLink } from '../items.js'
import PageHeader from '../components/PageHeader.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'

const EMPTY = {
  type: null,
  name: '',
  priority: null,
  notes: '',
  links: [''],
  size: '',
  colour: '',
  variant: '',
  likes: '',
  example_links: [''],
  photos: [],
}

// Add an item (/add, or /add?for=jaisley for managers), suggest a secret idea for
// someone (/add?for=laura&suggest=1), or edit either one (/item/:id/edit).
export default function ItemForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { me, managed, people } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(isEdit ? null : EMPTY)
  const [original, setOriginal] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [triedToSave, setTriedToSave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [addTo, setAddTo] = useState(params.get('for')) // managers can switch whose wishlist

  // Whose list it goes on: yours, a profile you manage, or (for an idea) anyone else's
  const suggestFor = !isEdit && params.get('suggest') === '1' ? people.find((p) => p.slug === params.get('for')) : null
  const isSuggestion = isEdit ? Boolean(original?.is_suggestion) : Boolean(suggestFor)
  const owner = isEdit
    ? people.find((p) => p.id === original?.owner_id)
    : (suggestFor ?? managed.find((p) => p.slug === addTo) ?? me)
  const listLink = isSuggestion
    ? `/person/${owner?.slug}`
    : owner && owner.id !== me.id
      ? `/me?for=${owner.slug}`
      : '/me'
  const title = isSuggestion ? `Idea for ${owner?.name}` : isEdit ? 'Edit item' : 'Add to wishlist'
  const whoFor = <WhoFor {...{ isSuggestion, isEdit, owner, me, managed, setAddTo }} />

  useEffect(() => {
    if (!isEdit) return
    loadItem(id)
      .then((item) => {
        if (!item || item.deleted_at) return setLoadError("This item isn't on the list anymore.")
        setOriginal(item)
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, item[key] ?? EMPTY[key]])),
          links: item.links.length ? item.links : [''],
          example_links: item.example_links.length ? item.example_links : [''],
        })
      })
      .catch(() => setLoadError("Couldn't load this item. Check your connection and try again."))
  }, [id, isEdit])

  if (loadError) return <Message text={loadError} fallback={listLink} />
  if (!form) return null
  if (isEdit && !canEditItem(original, me, owner)) {
    return <Message text="You can't edit this item." fallback={listLink} />
  }
  if (isSuggestion && owner?.id === me.id) {
    return <Message text="Ideas are for other people's wishlists." fallback="/me" />
  }

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  // Step 1 when adding: pick the type
  if (!form.type) {
    return (
      <div className="page form-page">
        <PageHeader title={title} fallback={listLink} />
        {whoFor}
        <p className="form-question">What kind of item is it?</p>
        <div className="type-choices">
          {Object.entries(TYPES).map(([value, { label, hint }]) => (
            <button key={value} className="type-choice" onClick={() => set('type', value)}>
              <span className="type-choice-label">{label}</span>
              <span className="type-choice-hint">{hint}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const links = form.links.map(normalizeLink).filter(Boolean)
  const examples = form.example_links.map(normalizeLink).filter(Boolean)
  const problems = {
    name: !form.name.trim() && 'Give it a name',
    priority: !form.priority && (isSuggestion ? 'Pick how much they would want it' : 'Pick how much you want it'),
  }
  const hasProblems = Object.values(problems).some(Boolean)
  const show = (field) => triedToSave && problems[field] && <p className="field-error">{problems[field]}</p>

  const save = async () => {
    setTriedToSave(true)
    setSaveError('')
    if (hasProblems) return
    setSaving(true)

    // Only keep the fields that belong to the chosen type
    const exact = form.type === 'exact'
    const clean = (text) => text.trim() || null
    const fields = {
      type: form.type,
      name: form.name.trim(),
      priority: form.priority,
      notes: clean(form.notes),
      photos: form.photos,
      links: exact ? links : [],
      size: exact ? clean(form.size) : null,
      colour: exact ? clean(form.colour) : null,
      variant: exact ? clean(form.variant) : null,
      likes: exact ? null : clean(form.likes),
      example_links: exact ? [] : examples,
    }

    const { error } = isEdit
      ? await supabase.from('items').update(fields).eq('id', id)
      : await supabase.from('items').insert({ ...fields, owner_id: owner.id, is_suggestion: isSuggestion })

    setSaving(false)
    if (error) return setSaveError("Couldn't save. Check your connection and try again.")
    if (isEdit) navigate(-1)
    else navigate(listLink, { replace: true })
  }

  const remove = async () => {
    const { error } = await supabase.rpc('delete_item', { target_item: id })
    if (error) return setSaveError("Couldn't delete. Check your connection and try again.")
    navigate(listLink, { replace: true })
  }

  return (
    <div className="page form-page">
      <PageHeader title={title} fallback={listLink} />
      {whoFor}

      <div className="toggle">
        {Object.entries(TYPES).map(([value, { label, hint }]) => (
          <button
            key={value}
            className={`toggle-option${form.type === value ? ' selected' : ''}`}
            onClick={() => set('type', value)}
          >
            {label}
            <span className="toggle-hint">{hint}</span>
          </button>
        ))}
      </div>

      <Field label="Name" required>
        <input
          className="input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={form.type === 'exact' ? 'e.g. Simons cotton boxer briefs' : 'e.g. Beard oil'}
        />
        {show('name')}
      </Field>

      <Field label={isSuggestion ? 'How much would they want it?' : 'How much do you want it?'} required>
        <div className="priority-choices">
          {PRIORITIES.map(({ value, label }) => (
            <button
              key={value}
              className={`choice${form.priority === value ? ' selected' : ''}`}
              onClick={() => set('priority', value)}
            >
              {label}
            </button>
          ))}
        </div>
        {show('priority')}
      </Field>

      <Field label="Photos">
        <PhotoPicker photos={form.photos} onChange={(photos) => set('photos', photos)} showCover pasteAnywhere />
      </Field>

      {form.type === 'exact' ? (
        <>
          <Field label="Product link">
            <ListInput
              values={form.links}
              onChange={(v) => set('links', v)}
              placeholder="Paste the link if you have it"
              addLabel="+ Add another link"
              inputMode="url"
            />
          </Field>
          <Field label="Size">
            <input className="input" value={form.size} onChange={(e) => set('size', e.target.value)} />
          </Field>
          <Field label="Colour">
            <input className="input" value={form.colour} onChange={(e) => set('colour', e.target.value)} />
          </Field>
          <Field label="Variant">
            <input
              className="input"
              value={form.variant}
              onChange={(e) => set('variant', e.target.value)}
              placeholder="e.g. scent, model, style"
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={isSuggestion ? "Why they'd like it" : 'What I like about it'}>
            <textarea
              className="input"
              rows={3}
              value={form.likes}
              onChange={(e) => set('likes', e.target.value)}
              placeholder="e.g. woodsy scents, not too oily"
            />
          </Field>
          <Field label="Example links or brands">
            <ListInput
              values={form.example_links}
              onChange={(v) => set('example_links', v)}
              placeholder="A link or a brand name"
              addLabel="+ Add another"
            />
          </Field>
        </>
      )}

      <Field label="Notes">
        <textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      {triedToSave && hasProblems && <p className="field-error">Fill in the missing bits above.</p>}
      {saveError && <p className="field-error">{saveError}</p>}

      <button className="btn btn-primary btn-block btn-large" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>

      {isEdit && (
        <div className="delete-area">
          {confirmingDelete ? (
            <>
              <p>{isSuggestion ? 'Delete this idea?' : 'Delete this item from your wishlist?'}</p>
              <div className="action-row">
                <button className="btn btn-secondary" onClick={remove}>
                  Yes, delete it
                </button>
                <button className="btn" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button className="btn-link" onClick={() => setConfirmingDelete(true)}>
              {isSuggestion ? 'Delete idea' : 'Delete item'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Who it's for: a note for ideas and for managed profiles, and a switch for managers adding
function WhoFor({ isSuggestion, isEdit, owner, me, managed, setAddTo }) {
  if (isSuggestion) {
    return <p className="form-note">{owner.name} won't see this idea. Everyone else can see it and get it.</p>
  }
  if (!isEdit && managed.length > 0) {
    return (
      <div className="toggle">
        {[me, ...managed].map((p) => (
          <button
            key={p.id}
            className={`toggle-option${p.id === owner.id ? ' selected' : ''}`}
            onClick={() => setAddTo(p.id === me.id ? null : p.slug)}
          >
            {p.id === me.id ? 'My Wishlist' : `${p.name}'s Wishlist`}
          </button>
        ))}
      </div>
    )
  }
  if (owner && owner.id !== me.id) return <p className="muted">On {owner.name}'s wishlist</p>
  return null
}

function Field({ label, required, children }) {
  return (
    <div className="field">
      <div className="field-label">
        {label}
        {required && <span className="muted"> (required)</span>}
      </div>
      {children}
    </div>
  )
}

// A list of text boxes with "+ Add another" (product links, example brands).
function ListInput({ values, onChange, placeholder, addLabel, inputMode }) {
  const update = (index, value) => onChange(values.map((v, i) => (i === index ? value : v)))
  const removeAt = (index) => onChange(values.length > 1 ? values.filter((_, i) => i !== index) : [''])
  return (
    <div className="list-input">
      {values.map((value, i) => (
        <div key={i} className="list-input-row">
          <input
            className="input"
            value={value}
            inputMode={inputMode}
            autoCapitalize="off"
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
          />
          {(values.length > 1 || value) && (
            <button className="icon-button" onClick={() => removeAt(i)} aria-label="Remove">
              ×
            </button>
          )}
        </div>
      ))}
      <button className="btn-link" onClick={() => onChange([...values, ''])}>
        {addLabel}
      </button>
    </div>
  )
}

function Message({ text, fallback }) {
  return (
    <div className="page">
      <PageHeader fallback={fallback} />
      <p>{text}</p>
    </div>
  )
}
