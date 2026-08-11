import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

export default function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // sessionStorage clears when the browser tab closes — each new session
    // requires re-entering the password, which is the right tradeoff for
    // a shared device vs. a permanent "remember me"
    const stored = sessionStorage.getItem('sse_authenticated')
    if (stored === 'true') {
      setAuthenticated(true)
    }
    setChecked(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.setItem('sse_authenticated', 'true')
        setAuthenticated(true)
      } else {
        setError('Incorrect password. Try again.')
      }
    } catch (err) {
      setError('Could not verify password. Check your connection.')
    }
    setSubmitting(false)
  }

  // avoid a flash of the login screen while checking sessionStorage
  if (!checked) return null

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
              <Lock size={20} className="text-rose-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Simply South</h1>
            <p className="text-sm text-gray-500 mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full bg-rose-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Checking...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return children
}