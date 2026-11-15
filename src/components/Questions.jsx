import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { useAuth } from '../auth.jsx'
import { loadQuestions } from '../items.js'
import PhotoPicker from './PhotoPicker.jsx'
import Lightbox from './Lightbox.jsx'

// FAQ-style anonymous questions at the bottom of a profile.
//   Givers ask (nobody ever sees who asked, not even the owner).
//   The owner, or a manager for Jaisley, answers.
//   onLoad gets the list each time it (re)loads, so My Wishlist can keep its count current.
export default function Questions({ profile, onLoad }) {
  const { me } = useAuth()
  const canAnswer = profile.id === me.id || profile.managed_by.includes(me.id)
  const [questions, setQuestions] = useState(null)
  const [asking, setAsking] = useState(false)
  const [photo, setPhoto] = useState(null) // full-screen photo

  const load = () =>
    loadQuestions(profile.id)
      .catch(() => [])
      .then((list) => {
        setQuestions(list)
        onLoad?.(list)
      })

  useEffect(() => {
    load()
  }, [profile.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="questions" id="questions">
      <h2 className="section-title">Questions</h2>

      {!canAnswer &&
        (asking ? (
          <AskForm
            profile={profile}
            onDone={() => {
              setAsking(false)
              load()
            }}
          />
        ) : (
          <button className="btn btn-secondary btn-block btn-large" onClick={() => setAsking(true)}>
            Ask {profile.name} a question
          </button>
        ))}

      {questions?.length === 0 && (
        <p className="empty">
          {canAnswer ? 'No questions yet.' : `No questions yet. Not sure what ${profile.name} would like? Ask!`}
        </p>
      )}

      <ul className="question-list">
        {questions?.map((q) => (
          <Question key={q.id} question={q} canAnswer={canAnswer} onChange={load} onPhoto={setPhoto} />
        ))}
      </ul>

      <Lightbox src={photo} onClose={() => setPhoto(null)} />
    </section>
  )
}

// Home page box: unanswered questions on your profile (and any you manage),
// answerable right there. Each one drops off the list once it's answered.
export function WaitingQuestions({ questions, onChange }) {
  const { me, people } = useAuth()
  const [photo, setPhoto] = useState(null)
  const nameOf = (id) => people.find((p) => p.id === id)?.name

  return (
    <section className="waiting-questions">
      <h2 className="section-title">Questions</h2>
      <ul className="question-list">
        {questions.map((q) => (
          <Question
            key={q.id}
            question={q}
            forName={q.profile_id === me.id ? null : nameOf(q.profile_id)}
            canAnswer
            onChange={onChange}
            onPhoto={setPhoto}
          />
        ))}
      </ul>
      <Lightbox src={photo} onClose={() => setPhoto(null)} />
    </section>
  )
}

function Question({ question: q, forName, canAnswer, onChange, onPhoto }) {
  const [answering, setAnswering] = useState(false)

  const remove = async () => {
    if (!window.confirm('Delete this question?')) return
    await supabase.rpc('delete_question', { target_question: q.id })
    onChange()
  }

  return (
    <li className="question">
      {forName && <p className="question-for">For {forName}</p>}
      <p className="question-body">
        <span className="question-mark">Q</span>
        {q.body}
      </p>
      <PhotoRow photos={q.photos} onPhoto={onPhoto} />

      {answering ? (
        <AnswerForm
          question={q}
          onDone={() => {
            setAnswering(false)
            onChange()
          }}
        />
      ) : q.answer ? (
        <div className="answer">
          <p className="answer-body">
            <span className="question-mark answer-mark">A</span>
            {q.answer}
          </p>
          <PhotoRow photos={q.answer_photos} onPhoto={onPhoto} />
        </div>
      ) : null}

      {!answering && (
        <div className="question-actions">
          {canAnswer && (
            <button className={q.answer ? 'btn-link' : 'btn btn-primary'} onClick={() => setAnswering(true)}>
              {q.answer ? 'Edit answer' : 'Answer'}
            </button>
          )}
          {(canAnswer || q.asked_by_me) && (
            <button className="btn-link" onClick={remove}>
              Delete
            </button>
          )}
          {q.asked_by_me && <span className="muted question-mine">You asked this</span>}
        </div>
      )}
    </li>
  )
}

function PhotoRow({ photos, onPhoto }) {
  if (!photos.length) return null
  return (
    <div className="question-photos">
      {photos.map((src) => (
        <button key={src} className="question-photo" onClick={() => onPhoto(src)} aria-label="Open photo">
          <img src={src} alt="" />
        </button>
      ))}
    </div>
  )
}

function AskForm({ profile, onDone }) {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!text.trim()) return setError('Type your question first')
    setBusy(true)
    const { error } = await supabase.rpc('ask_question', {
      target_profile: profile.id,
      question: text.trim(),
      question_photos: photos,
    })
    setBusy(false)
    if (error) return setError("Couldn't send. Check your connection and try again.")
    onDone()
  }

  return (
    <div className="question-form">
      <textarea
        className="input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Which of these two scarves do you like more?"
        autoFocus
      />
      <PhotoPicker photos={photos} onChange={setPhotos} />
      <p className="form-note">Your name won't be shown. Not even {profile.name} will know who asked.</p>
      {error && <p className="field-error">{error}</p>}
      <div className="action-row">
        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {busy ? 'Sending…' : 'Ask'}
        </button>
        <button className="btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function AnswerForm({ question, onDone }) {
  const [text, setText] = useState(question.answer ?? '')
  const [photos, setPhotos] = useState(question.answer_photos)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setBusy(true)
    const { error } = await supabase.rpc('answer_question', {
      target_question: question.id,
      answer_text: text,
      new_photos: photos,
    })
    setBusy(false)
    if (error) return setError("Couldn't save. Check your connection and try again.")
    onDone()
  }

  return (
    <div className="question-form">
      <textarea
        className="input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your answer"
        autoFocus
      />
      <PhotoPicker photos={photos} onChange={setPhotos} />
      {error && <p className="field-error">{error}</p>}
      <div className="action-row">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save answer'}
        </button>
        <button className="btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  )
}
