import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import StockTag from '../components/StockTag'
import { input, primary } from '../components/ui'
import { kes } from '../utils/format'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/products/${id}/`, { auth: false }).then(setProduct).catch((e) => setError(e.message))
  }, [id])

  async function add() {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await addItem(product.id, Number(quantity))
      setNotice('Added to your cart.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!product) {
    return error ? <Alert>{error}</Alert> : <p>Loading...</p>
  }

  return (
    <div>
      <Link to="/products" className="text-sm font-semibold text-brand">Back to products</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl bg-sky-100 text-slate-600">
            No image
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-slate-600">{product.category_name} - {product.pack_size}</p>
          <p className="mt-4 text-2xl font-bold">{kes(product.price)}</p>
          <div className="mt-2"><StockTag product={product} /></div>
          {product.description && <p className="mt-4">{product.description}</p>}
          {product.intended_use && (
            <p className="mt-3"><b>Intended use:</b> {product.intended_use}</p>
          )}
          {user?.role !== 'admin' && (
            <div className="mt-6 flex items-end gap-3">
              <div>
                <label htmlFor="qty" className="text-sm font-medium">Quantity</label>
                <input id="qty" type="number" min="1" max={product.stock_quantity || 1}
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className={`${input} w-24`} />
              </div>
              <button onClick={add} disabled={!product.in_stock || busy} className={primary}>
                {product.in_stock ? (busy ? 'Adding...' : 'Add to cart') : 'Out of stock'}
              </button>
            </div>
          )}
          <div className="mt-4 space-y-2">
            <Alert>{error}</Alert>
            <Alert kind="success">{notice}</Alert>
          </div>
        </div>
      </div>
    </div>
  )
}