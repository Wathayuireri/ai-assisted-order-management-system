import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Alert from '../components/Alert'
import { input, primary } from '../components/ui'

export default function Contact() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    email: user?.email || '',
    message: '',
  })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/contact/', { method: 'POST', body: form, auth: false })
      setSent(true)
      setForm({ ...form, message: '' })
    } catch (err) {
      setError(err.status === 429 ? 'You have sent too many messages. Please try again later.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">Contact us</h1>
      <p className="mt-1 text-slate-600">Send a question, complaint or compliment to our managers.</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        <Alert kind="success">{sent ? 'Your message has been sent. Thank you.' : ''}</Alert>
        <div>
          <label htmlFor="name" className="text-sm font-medium">Your name</label>
          <input id="name" required value={form.name} onChange={set('name')} className={input} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set('email')} className={input} />
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-medium">Message</label>
          <textarea id="message" required rows="5" minLength="10" maxLength="2000"
            value={form.message} onChange={set('message')} className={input} />
        </div>
        <button type="submit" disabled={busy} className={primary}>
          {busy ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </div>
  )
}