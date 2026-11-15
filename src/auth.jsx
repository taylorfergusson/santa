import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { PASSWORD_PREFIX, emailFor } from './config.js'

const AuthContext = createContext(null)

// Keeps track of who's logged in.
//   me:      your row from `people`
//   managed: profiles you manage (e.g. Jaisley for Jenn and Jordan)
//   people:  the whole family, in sort order
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [me, setMe] = useState(undefined) // undefined = still loading, null = no profile found
  const [managed, setManaged] = useState([])
  const [people, setPeople] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setMe(undefined)
      setManaged([])
      setPeople([])
      return
    }
    supabase
      .from('people')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        const mine = data?.find((p) => p.auth_user_id === userId) ?? null
        setMe(mine)
        setPeople(data ?? [])
        setManaged(mine ? data.filter((p) => p.managed_by.includes(mine.id)) : [])
      })
  }, [userId])

  const value = {
    session,
    me,
    managed,
    people,
    // Still working out who's logged in (session check, then loading the people row)
    loading: session === undefined || (session && me === undefined),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// Names aren't case sensitive: the login email is always the lowercase slug.
export async function logIn(slug, passcode) {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailFor(slug.toLowerCase()),
    password: PASSWORD_PREFIX + passcode,
  })
  return error
}

export async function logOut() {
  await supabase.auth.signOut()
}
