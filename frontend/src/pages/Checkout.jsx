import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import PaymentPanel from '../components/PaymentPanel'
import { card, input, primary } from '../components/ui'
import { kes } from '../utils/format'

export default function Checkout() {
  const { user } = useAuth()
  const { cart, refresh } = useCart()
  const [phone, setPhone] = useState(user?.phone || '')
  const [notes, setNotes] = useState('')
  const [order, setOrder] = useState(null)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [stripeBusy, setStripeBusy] = useState(false)

  // State to control the popup and read the URL
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Check if Stripe redirected back with ?success=true
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessPopup(true);
      setPaid(true); 
      
      // Clean the URL so the popup doesn't appear again on refresh
      navigate('/checkout', { replace: true }); 
    }
  }, [searchParams, navigate]);

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await api('/orders/checkout/', {
        method: 'POST',
        body: { contact_phone: phone, notes },
      })
      setOrder(created)
      await refresh()
    } catch (err) {
      setError(err.message)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function payWithStripe() {
    setError('')
    setStripeBusy(true)
    try {
      const response = await api('/payments/stripe/create-session/', {
        method: 'POST',
        body: { order: order.id }
      })
      if (response.url) {
        window.location.href = response.url
      }
    } catch (err) {
      setError(err.message || 'Could not connect to Stripe.')
      setStripeBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      
      {/* SUCCESS POPUP MODAL */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
            <p className="text-slate-600 mb-6">Your payment has been processed and your order has been received.</p>
            <button 
              onClick={() => {
                setShowSuccessPopup(false);
                navigate('/'); // Takes user back to home page
              }}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {order ? (
        <div className="space-y-4">
          <div className={card}>
            <h1 className="text-2xl font-bold">Order placed</h1>
            <p className="mt-1">Reference: <b>{order.reference}</b></p>
            <p>Total: <b>{kes(order.total_amount)}</b></p>
          </div>
          
          <PaymentPanel order={order} onPaid={() => setPaid(true)} />

          <div className={`${card} border-t-4 border-blue-500`}>
            <h3 className="font-bold text-lg mb-2">Pay with Card</h3>
            <p className="text-sm text-slate-600 mb-4">Secure payment powered by Stripe.</p>
            <Alert>{error}</Alert>
            <button 
              onClick={payWithStripe} 
              disabled={stripeBusy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {stripeBusy ? 'Connecting to Stripe...' : 'Pay with Card'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link to={`/orders/${order.id}`} className="text-brand">
              {paid ? 'View your order' : 'Pay later from your order page'}
            </Link>
            <Link to="/products" className="text-slate-700">Continue shopping</Link>
          </div>
        </div>
      ) : !cart ? (
        <p>Loading...</p>
      ) : cart.items.length === 0 ? (
        <div className={card}>
          <p>Your cart is empty.</p>
          <Link to="/products" className="font-semibold text-brand">Browse products</Link>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <div className={`${card} mt-4`}>
            <p className="font-semibold">{cart.item_count} items, {kes(cart.total)}</p>
            {!cart.can_checkout && (
              <p className="mt-2 text-sm text-red-700">
                Some items cannot be ordered. <Link to="/cart" className="font-semibold underline">Fix your cart</Link>
              </p>
            )}
          </div>
          <form onSubmit={placeOrder} className={`${card} mt-4 space-y-4`}>
            <Alert>{error}</Alert>
            <div>
              <label htmlFor="phone" className="text-sm font-medium">Contact phone number</label>
              <input id="phone" required placeholder="0712345678" value={phone}
                onChange={(e) => setPhone(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
              <textarea id="notes" rows="3" maxLength="500" value={notes}
                onChange={(e) => setNotes(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={busy || !cart.can_checkout} className={`${primary} w-full`}>
              {busy ? 'Placing order...' : 'Place order'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}