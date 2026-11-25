import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import { card, input, primary } from '../components/ui'
import { kes } from '../utils/format'

export default function Checkout() {
  const { user } = useAuth()
  const { cart, refresh } = useCart()
  const navigate = useNavigate()
  
  const [phone, setPhone] = useState(user?.phone || '')
  const [deliveryLocation, setDeliveryLocation] = useState('') // <-- ADDED
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const paymentId = searchParams.get('payment_id')
    
    if (success === 'true' && paymentId) {
      api(`/payments/${paymentId}/`)
        .then((paymentData) => {
          refresh()
          navigate(`/receipt/${paymentData.order}`, { replace: true })
        })
        .catch((err) => {
          console.error("Failed to load receipt:", err)
          setError("Payment succeeded but receipt failed to load.")
        })
    }
  }, [searchParams, navigate, refresh])

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    if (!phone) {
      setError("Please provide a contact phone number.")
      setBusy(false)
      return
    }

    if (!deliveryLocation) {
      setError("Please provide a delivery location.")
      setBusy(false)
      return
    }

    try {
      navigate('/payments', { 
        state: { 
          phone: phone, 
          delivery_location: deliveryLocation, // <-- ADDED
          notes: notes 
        } 
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!cart) return <p>Loading...</p>
  
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl text-center py-10">
        <p className="text-xl text-gray-600">Your cart is empty.</p>
        <Link to="/products" className="text-blue-600 hover:underline mt-2 inline-block">Shop now</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold">Checkout</h1>
      
      <div className={`${card} mt-4`}>
        <p className="font-semibold">{cart.item_count} items, Total: {kes(cart.total)}</p>
        {!cart.can_checkout && (
          <p className="mt-2 text-sm text-red-700">
            Some items cannot be ordered. <Link to="/cart" className="font-semibold underline">Fix your cart</Link>
          </p>
        )}
      </div>

      <form onSubmit={handlePlaceOrder} className={`${card} mt-4 space-y-4`}>
        <Alert>{error}</Alert>
        
        <div>
          <label htmlFor="phone" className="text-sm font-medium">Contact phone number</label>
          <input 
            id="phone" 
            required 
            placeholder="0712345678" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)} 
            className={input} 
          />
        </div>

        <div>
          <label htmlFor="deliveryLocation" className="text-sm font-medium">Delivery Location</label>
          <input 
            id="deliveryLocation" 
            required 
            placeholder="e.g., Westlands, Nairobi" 
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)} 
            className={input} 
          />
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
          <textarea 
            id="notes" 
            rows="3" 
            maxLength="500" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)} 
            className={input} 
          />
        </div>

        <div className="flex gap-3">
          <button 
            type="submit" 
            disabled={busy || !cart.can_checkout} 
            className={`${primary} w-full`}
          >
            {busy ? 'Processing...' : 'Place Order'}
          </button>
          
          <Link 
            to="/cart" 
            className="w-full text-center py-3 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-semibold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}