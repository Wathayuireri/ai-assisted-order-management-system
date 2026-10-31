import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Alert from '../components/Alert'
import { input, primary } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(email.trim().toLowerCase(), password)
      const from = location.state?.from
      navigate(from || (user.role === 'admin' ? '/admin' : '/products'), { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Wrong email or password.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className={input} />
        </div>
        <button type="submit" disabled={busy} className={`${primary} w-full`}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New here? <Link to="/register" className="font-semibold text-brand">Create an account</Link>
      </p>
    </div>
  )
}