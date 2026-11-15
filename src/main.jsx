import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@fontsource-variable/inter/index.css'
import '@fontsource/berkshire-swash/400.css'
import './theme.css'
import './app.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
