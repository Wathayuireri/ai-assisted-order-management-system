import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useCart } from '../cart/CartContext'
import Alert from './Alert'
import { input, primary } from './ui'
import { kes } from '../utils/format'

function DraftCard({ draft }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function reviewAndConfirm() {
    setBusy(true)
    setError('')
    try {
      for (const item of draft.items) {
        await addItem(item.product_id, item.quantity)
      }
      navigate('/cart')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Draft order</p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
          Not placed yet
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {draft.items.map((i) => (
          <li key={i.product_id} className="flex justify-between gap-3">
            <span>{i.quantity} x {i.product_name} ({i.pack_size})</span>
            <b>{kes(i.line_total)}</b>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{kes(draft.total)}</span>
      </p>
      <button disabled={busy} onClick={reviewAndConfirm} className={`${primary} mt-3 w-full`}>
        {busy ? 'Adding...' : 'Review and confirm'}
      </button>
      <p className="mt-2 text-xs text-slate-600">
        This adds the items to your cart. You pay at checkout. The assistant cannot place an order for you.
      </p>
      {error && <div className="mt-2"><Alert>{error}</Alert></div>}
    </div>
  )
}

export default function AssistantChat({ endpoint, intro, suggestions = [], allowDraft = false }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottom = useRef(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(question) {
    const message = question.trim()
    if (!message || busy) return
    setError('')
    setText('')
    setBusy(true)
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
    setMessages((current) => [...current, { role: 'user', content: message }])
    try {
      const data = await api(endpoint, { method: 'POST', body: { message, history } })
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.answer, draft: allowDraft ? data.draft : null },
      ])
    } catch (e) {
      setError(
        e.status === 429
          ? 'You have asked a lot of questions. Please wait a while and try again.'
          : e.message,
      )
    } finally {
      setBusy(false)
    }
  }

  function submit(e) {
    e.preventDefault()
    send(text)
  }

  return (
    <div className="flex h-[70vh] min-h-[28rem] flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div>
            <p className="text-slate-700">{intro}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, index) =>
          m.role === 'user' ? (
            <div key={index} className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-xl bg-sky-100 px-4 py-2">
              {m.content}
            </div>
          ) : (
            <div key={index} className="max-w-[85%] rounded-xl border border-slate-200 px-4 py-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                AI-generated
              </span>
              <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              {m.draft && <DraftCard draft={m.draft} />}
            </div>
          ),
        )}
        {busy && <p className="text-sm text-slate-600">The assistant is thinking...</p>}
        <div ref={bottom} />
      </div>

      <div className="border-t border-slate-200 p-3">
        {error && <div className="mb-2"><Alert>{error}</Alert></div>}
        <form onSubmit={submit} className="flex gap-2">
          <input aria-label="Your question" maxLength={500} value={text}
            onChange={(e) => setText(e.target.value)} placeholder="Type your question"
            className={`${input} !mt-0 flex-1`} />
          <button type="submit" disabled={busy || !text.trim()} className={primary}>Send</button>
        </form>
        <p className="mt-2 text-xs text-slate-600">
          The assistant can make mistakes. Check the product label, and ask our staff if you are unsure.
        </p>
      </div>
    </div>
  )
}