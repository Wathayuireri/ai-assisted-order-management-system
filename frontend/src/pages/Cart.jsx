import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import { card, primary, secondary } from '../components/ui'
import { kes } from '../utils/format'

export default function Cart() {
  const { cart, setQuantity, removeItem, clearCart } = useCart()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setError('')
    setBusy(true)
    try {
      await action()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!cart) return <p>Loading your cart...</p>

  if (cart.items.length === 0) {
    return (
      <div className={card}>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/products" className={`${primary} mt-4 inline-block`}>Browse products</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Your cart</h1>
      <div className="mt-4"><Alert>{error}</Alert></div>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          {cart.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4 last:border-0">
              <div>
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-slate-600">{item.pack_size}, {kes(item.unit_price)} each</p>
                {item.problem && (
                  <p className="mt-1 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                    {item.problem}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button aria-label="Decrease quantity" disabled={busy || item.quantity <= 1}
                  onClick={() => run(() => setQuantity(item.id, item.quantity - 1))}
                  className={`${secondary} px-3`}>-</button>
                <b className="w-8 text-center">{item.quantity}</b>
                <button aria-label="Increase quantity" disabled={busy || item.quantity >= item.stock_quantity}
                  onClick={() => run(() => setQuantity(item.id, item.quantity + 1))}
                  className={`${secondary} px-3`}>+</button>
              </div>
              <b className="w-28 text-right">{kes(item.line_total)}</b>
              <button disabled={busy} onClick={() => run(() => removeItem(item.id))}
                className="text-sm font-semibold text-red-700">Remove</button>
            </div>
          ))}
          <button disabled={busy} onClick={() => run(clearCart)}
            className="mt-3 text-sm font-semibold text-slate-600 underline">Clear cart</button>
        </div>

        <div className={`${card} h-fit`}>
          <h2 className="text-xl font-bold">Order summary</h2>
          <div className="mt-3 flex justify-between"><span>Items ({cart.item_count})</span><span>{kes(cart.total)}</span></div>
          <div className="mt-2 flex justify-between text-lg"><b>Total</b><b>{kes(cart.total)}</b></div>
          {cart.can_checkout ? (
            <Link to="/checkout" className={`${primary} mt-5 block text-center`}>Proceed to checkout</Link>
          ) : (
            <p className="mt-4 text-sm text-red-700">Fix the items marked above before you check out.</p>
          )}
        </div>
      </div>
    </div>
  )
}