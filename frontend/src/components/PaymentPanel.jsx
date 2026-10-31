import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Alert from './Alert'
import { input, primary, secondary } from './ui'
import { kes } from '../utils/format'

export default function PaymentPanel({ order, onPaid }) {
  const { user } = useAuth()
  const [phone, setPhone] = useState(user?.phone || '')
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const simulated = payment?.checkout_request_id?.startsWith('SIM-')
  const pending = payment?.status === 'pending'

  // For a real M-Pesa payment, check the result every 3 seconds.
  useEffect(() => {
    if (!pending || simulated) return undefined
    const timer = setInterval(async () => {
      try {
        const latest = await api(`/payments/${payment.id}/`)
        setPayment(latest)
        if (latest.status === 'success') onPaid?.()
      } catch {
        /* keep waiting */
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [pending, simulated, payment?.id, onPaid])

  async function start(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      setPayment(
        await api('/payments/start/', { method: 'POST', body: { order: order.id, mpesa_phone: phone } }),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function simulate(result) {
    setError('')
    setBusy(true)
    try {
      const updated = await api(`/payments/${payment.id}/simulate/`, {
        method: 'POST',
        body: { result },
      })
      setPayment(updated)
      if (updated.status === 'success') onPaid?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (payment?.status === 'success') {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-green-800">
        <p className="font-semibold">Payment received. Thank you!</p>
        <p className="text-sm">M-Pesa receipt: {payment.mpesa_receipt}</p>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        {simulated ? (
          <>
            <p className="font-semibold">Simulated payment of {kes(payment.amount)}</p>
            <p className="text-sm text-slate-700">
              Development mode: choose the result a real M-Pesa payment would give.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => simulate('success')} className={primary}>Simulate success</button>
              <button disabled={busy} onClick={() => simulate('failed')} className={secondary}>Simulate failure</button>
              <button disabled={busy} onClick={() => simulate('cancelled')} className={secondary}>Simulate cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold">Check your phone</p>
            <p className="text-sm text-slate-700">
              Enter your M-Pesa PIN on the prompt we sent to {payment.phone}. This page updates by itself.
            </p>
          </>
        )}
        <div className="mt-3"><Alert>{error}</Alert></div>
      </div>
    )
  }

  return (
    <form onSubmit={start} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-bold">Pay {kes(order.total_amount)} with M-Pesa</h3>
      {payment && (
        <Alert>The last payment was {payment.status_label.toLowerCase()}. You can try again.</Alert>
      )}
      <div>
        <label htmlFor="mpesa" className="text-sm font-medium">M-Pesa phone number</label>
        <input id="mpesa" required placeholder="0712345678" value={phone}
          onChange={(e) => setPhone(e.target.value)} className={input} />
      </div>
      <Alert>{error}</Alert>
      <button type="submit" disabled={busy} className={primary}>
        {busy ? 'Starting payment...' : 'Pay now'}
      </button>
    </form>
  )
}