import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AuthGate from './components/auth/AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthGate>
  </StrictMode>,
)