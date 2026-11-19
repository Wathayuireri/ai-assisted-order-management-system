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
    <div className="mx-auto max-w-4xl">
      {/* CONTACT DETAILS SECTION (From your screenshot) */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Contact Us</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          If you have any questions or need further information, please feel free to contact us or send us a message.
        </p>
        
        <div className="grid gap-6 sm:grid-cols-2 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Location:</h3>
            <p className="text-slate-700 mt-1">Crystal Building, Mai Mahiu Road,<br/>Opposite T-mall, Nairobi</p>
            
            <h3 className="text-lg font-bold text-slate-800 mt-6">Mobile:</h3>
            <p className="text-slate-700 mt-1">+254 725 095 477</p>
            <p className="text-slate-700">+254 716 259 355</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Email:</h3>
            <a href="mailto:sales@crystalchemical.co.ke" className="text-blue-600 hover:underline mt-1 block">
              sales@crystalchemical.co.ke
            </a>
          </div>
        </div>
      </div>

      {/* CONTACT FORM */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-1">Send us a message</h2>
        <p className="text-slate-600 mb-6">Send a question, complaint or compliment to our managers.</p>
        
        <form onSubmit={submit} className="space-y-4">
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
    </div>
  )
}