import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import { card, primary } from '../components/ui'
import { kes } from '../utils/format'

export default function Payments() {
  const { cart, refresh } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get phone and notes passed from Checkout page
  const { phone, notes } = location.state || {}
  
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If user lands here without details, send them back to checkout
  useEffect(() => {
    if (!phone || !cart || cart.items.length === 0) {
      navigate('/checkout')
    }
  }, [phone, cart, navigate])

  // 1. M-PESA Payment Handler
  async function payWithMpesa() {
    setError('')
    setBusy(true)
    try {
      // This creates the TEMPORARY order in the backend
      const res = await api('/payments/start/', {
        method: 'POST',
        body: { mpesa_phone: phone, notes: notes }
      })
      
      await refresh() // Clear local cart state
      
      // Redirect to the waiting page where they enter their PIN
      navigate(`/payment/${res.order_id}`)
    } catch (err) {
      setError(err.message || 'Failed to start M-PESA payment')
      setBusy(false)
    }
  }

  // 2. Stripe Payment Handler
  async function payWithStripe() {
    setError('')
    setBusy(true)
    try {
      // This creates the TEMPORARY order in the backend
      const res = await api('/payments/stripe/create-session/', {
        method: 'POST',
        body: { notes: notes }
      })
      
      // Redirect to Stripe hosted checkout
      if (res.url) {
        window.location.href = res.url
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Stripe')
      setBusy(false)
    }
  }

  if (!cart) return <p>Loading...</p>

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Select Payment Method</h1>
      
      <div className={`${card} mb-6`}>
        <h2 className="font-bold text-lg mb-2">Order Summary</h2>
        <p className="text-sm text-gray-600">Phone: {phone}</p>
        <p className="text-sm text-gray-600">Notes: {notes || 'None'}</p>
        <div className="border-t mt-2 pt-2 flex justify-between font-bold">
          <span>Total to Pay:</span>
          <span className="text-blue-600">{kes(cart.total)}</span>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="space-y-4">
        {/* M-PESA Option */}
        <button 
          onClick={payWithMpesa} 
          disabled={busy}
          className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors flex justify-center items-center ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {busy ? 'Processing...' : 'Pay with M-PESA'}
        </button>

        {/* Stripe Option */}
        <button 
          onClick={payWithStripe} 
          disabled={busy}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors flex justify-center items-center ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {busy ? 'Connecting...' : 'Pay with Card (Stripe)'}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link to="/checkout" className="text-red-500 font-semibold hover:underline">
          Cancel & Return to Checkout
        </Link>
      </div>
    </div>
  )
}