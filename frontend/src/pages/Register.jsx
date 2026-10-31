import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Alert from '../components/Alert'
import { input, primary } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', customer_type: 'individual', company_name: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        company_name: form.customer_type === 'business' ? form.company_name.trim() : '',
      })
      navigate('/products', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first" className="text-sm font-medium">First name</label>
            <input id="first" required value={form.first_name} onChange={set('first_name')} className={input} />
          </div>
          <div>
            <label htmlFor="last" className="text-sm font-medium">Last name</label>
            <input id="last" required value={form.last_name} onChange={set('last_name')} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set('email')} className={input} />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">Phone number</label>
          <input id="phone" required placeholder="0712345678" value={form.phone} onChange={set('phone')} className={input} />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" type="password" required minLength={8} value={form.password}
            onChange={set('password')} className={input} />
          <p className="mt-1 text-xs text-slate-600">At least 8 characters, not only numbers.</p>
        </div>
        <div>
          <label htmlFor="type" className="text-sm font-medium">I am ordering as</label>
          <select id="type" value={form.customer_type} onChange={set('customer_type')} className={input}>
            <option value="individual">An individual</option>
            <option value="business">A business or institution</option>
          </select>
        </div>
        {form.customer_type === 'business' && (
          <div>
            <label htmlFor="company" className="text-sm font-medium">Business or organisation name</label>
            <input id="company" required value={form.company_name} onChange={set('company_name')} className={input} />
            <p className="mt-1 text-xs text-slate-600">For example a school, hospital, hotel or shop.</p>
          </div>
        )}
        <button type="submit" disabled={busy} className={`${primary} w-full`}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-semibold text-brand">Sign in</Link>
      </p>
    </div>
  )
}