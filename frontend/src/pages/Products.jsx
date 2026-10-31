import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'
import Alert from '../components/Alert'
import ProductCard from '../components/ProductCard'
import { input } from '../components/ui'

export default function Products() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api('/categories/', { auth: false }).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (query) params.set('search', query)
    const qs = params.toString()
    api(`/products/${qs ? `?${qs}` : ''}`, { auth: false })
      .then((data) => {
        if (active) {
          setProducts(data)
          setError('')
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [category, query])

  async function onAdd(product) {
    if (!user) {
      navigate('/login', { state: { from: '/products' } })
      return
    }
    setNotice('')
    setError('')
    setBusyId(product.id)
    try {
      await addItem(product.id, 1)
      setNotice(`${product.name} added to your cart.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const tabClass = (active) =>
    `rounded-lg px-4 py-2 text-sm font-semibold ${
      active ? 'bg-brand text-white' : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
    }`

  return (
    <div>
      <h1 className="text-3xl font-bold">Our products</h1>
      <p className="mt-1 text-slate-600">Cleaning products, disinfectants and chemicals.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          aria-label="Search products"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${input} !mt-0 max-w-sm flex-1`}
        />
        <button onClick={() => setCategory('')} className={tabClass(category === '')}>All</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(String(c.id))}
            className={tabClass(category === String(c.id))}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Alert>{error}</Alert>
        <Alert kind="success">{notice}</Alert>
      </div>

      {loading && <p className="mt-6">Loading products...</p>}
      {!loading && products.length === 0 && !error && (
        <p className="mt-6 text-slate-600">No products match your search.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} role={user?.role}
            busy={busyId === p.id} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}