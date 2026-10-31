import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Alert from '../components/Alert'
import { card } from '../components/ui'
import { formatDate, kes, tagClass } from '../utils/format'

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/orders/').then(setOrders).catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!orders) return <p>Loading your orders...</p>

  return (
    <div>
      <h1 className="text-3xl font-bold">My orders</h1>
      {orders.length === 0 && (
        <p className="mt-4 text-slate-600">
          You have no orders yet. <Link to="/products" className="font-semibold text-brand">Browse products</Link>
        </p>
      )}
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className={`${card} flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50`}>
            <div>
              <p className="font-semibold">{o.reference}</p>
              <p className="text-sm text-slate-600">{formatDate(o.created_at)}</p>
            </div>
            <b>{kes(o.total_amount)}</b>
            <div className="flex gap-2">
              <span className={tagClass(o.status)}>{o.status_label}</span>
              <span className={tagClass(o.payment_status)}>{o.payment_status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}