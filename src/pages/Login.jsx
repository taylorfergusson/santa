import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useAuth, logIn } from '../auth.jsx'
import { SITE_TITLE, SITE_SUBTITLE } from '../config.js'
import Snowfall from '../components/Snowfall.jsx'
import Photo from '../components/Photo.jsx'
import { BackIcon, DeleteIcon } from '../components/Icons.jsx'

const PASSCODE_LENGTH = 4

// Step 1: tap your photo. Step 2: type the family passcode.
export default function Login() {
  const { session } = useAuth()
  const [people, setPeople] = useState(null)
  const [person, setPerson] = useState(null)

  useEffect(() => {
    // login_people leaves out managed profiles like Jaisley
    supabase
      .from('login_people')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setPeople(data ?? []))
  }, [])

  if (session) return <Navigate to="/" replace />
  if (person) return <PasscodePad person={person} onBack={() => setPerson(null)} />

  return (
    <div className="login-screen">
      <Snowfall />
      <div className="page login">
        <h1 className="login-title">{SITE_TITLE}</h1>
        <p className="login-subtitle">{SITE_SUBTITLE}</p>
        <h2 className="login-question">Who are you?</h2>
        <div className="login-grid">
          {people?.map((p) => (
            <button key={p.id} className="login-person" onClick={() => setPerson(p)}>
              <Photo src={p.photo_url} className="login-photo" />
              <span className="login-name">{p.name}</span>
            </button>
          ))}
        </div>
        {people?.length === 0 && (
          <p className="muted">Couldn't load the family. Check your connection and try again.</p>
        )}
      </div>
    </div>
  )
}

function PasscodePad({ person, onBack }) {
  const navigate = useNavigate()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (code) => {
    setBusy(true)
    const err = await logIn(person.slug, code)
    setBusy(false)
    if (err) {
      setDigits('')
      setError(
        err.status === 429 ? 'Too many tries. Wait a minute and try again.' : "That passcode didn't work. Try again.",
      )
    } else {
      navigate('/', { replace: true })
    }
  }

  const press = (key) => {
    if (busy) return
    setError('')
    if (key === 'delete') return setDigits(digits.slice(0, -1))
    if (digits.length >= PASSCODE_LENGTH) return
    const next = digits + key
    setDigits(next)
    // Submit as soon as the 4th digit is in
    if (next.length === PASSCODE_LENGTH) submit(next)
  }

  // Typing on a keyboard works too (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('delete')
      else if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="login-screen passcode-screen">
      <Snowfall />
      <div className="page login">
        <button className="back-button" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>

        <div className="passcode-header">
          <Photo src={person.photo_url} className="passcode-photo" />
          <div className="login-name">{person.name}</div>
          <p className="muted">Enter the family passcode</p>
        </div>

        <div className="passcode-dots" aria-label={`${digits.length} of ${PASSCODE_LENGTH} digits entered`}>
          {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
            <span key={i} className={`passcode-dot${i < digits.length ? ' filled' : ''}`} />
          ))}
        </div>

        <p className="passcode-message" role="alert">
          {busy ? 'Checking…' : error}
        </p>

        <div className="keypad-area">
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button key={n} className="keypad-key" onClick={() => press(n)}>
              {n}
            </button>
          ))}
          <span />
          <button className="keypad-key" onClick={() => press('0')}>
            0
          </button>
          <button className="keypad-key keypad-delete" onClick={() => press('delete')} aria-label="Delete">
            <DeleteIcon />
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
