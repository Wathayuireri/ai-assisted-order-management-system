import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { kes } from '../utils/format'

export default function Home() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/products/', { auth: false })
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold">Crystal Chemicals</h1>
      <p className="mt-2 text-slate-600">Cleaning products, disinfectants and chemicals.</p>

      {loading && <p className="mt-6">Loading products...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="mt-6">No products yet. Add some in the admin panel.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-slate-600">{p.pack_size}</p>
            <div className="mt-3 flex items-center justify-between">
              <b>{kes(p.price)}</b>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  p.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {p.stock_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}