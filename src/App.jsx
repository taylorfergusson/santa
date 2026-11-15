import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { SITE_TITLE } from './config.js'
import { AuthProvider, useAuth, logOut } from './auth.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Family from './pages/Family.jsx'
import PersonList from './pages/PersonList.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import ShoppingList from './pages/ShoppingList.jsx'
import MyList from './pages/MyList.jsx'
import ItemForm from './pages/ItemForm.jsx'

// Hash routing (#/family) because GitHub Pages has no server-side routing.
export default function App() {
  useEffect(() => {
    document.title = SITE_TITLE
  }, [])

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireLogin />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/family" element={<Family />} />
              <Route path="/person/:slug" element={<PersonList />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/item/:id/edit" element={<ItemForm />} />
              <Route path="/add" element={<ItemForm />} />
              <Route path="/shopping" element={<ShoppingList />} />
              <Route path="/me" element={<MyList />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

// Everything except the login screen needs someone logged in.
function RequireLogin() {
  const { session, me, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (!me) {
    return (
      <div className="page">
        <p>Your profile isn't set up yet. Ask Taylor.</p>
        <button className="btn" onClick={logOut}>Log out</button>
      </div>
    )
  }
  return <Outlet />
}
