import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Alert from '../components/Alert'
import PaymentPanel from '../components/PaymentPanel'
import { card } from '../components/ui'
import { formatDate, kes, tagClass } from '../utils/format'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api(`/orders/${id}/`).then(setOrder).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (error) return <Alert>{error}</Alert>
  if (!order) return <p>Loading...</p>

  return (
    <div className="space-y-4">
      <Link to="/orders" className="text-sm font-semibold text-brand">Back to my orders</Link>
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{order.reference}</h1>
          <div className="flex gap-2">
            <span className={tagClass(order.status)}>{order.status_label}</span>
            <span className={tagClass(order.payment_status)}>{order.payment_status}</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Placed {formatDate(order.created_at)}. Contact phone: {order.contact_phone}
        </p>
        {order.notes && <p className="mt-2 text-sm">Notes: {order.notes}</p>}

        <div className="mt-4">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between border-b border-slate-200 py-2 text-sm last:border-0">
              <span>{i.quantity} x {i.product_name} ({kes(i.unit_price)})</span>
              <b>{kes(i.line_total)}</b>
            </div>
          ))}
          <div className="mt-3 flex justify-between text-lg"><b>Total</b><b>{kes(order.total_amount)}</b></div>
        </div>
      </div>

      {!order.is_paid && order.status !== 'cancelled' && (
        <PaymentPanel order={order} onPaid={load} />
      )}

      <div className={card}>
        <h2 className="text-lg font-bold">Order progress</h2>
        <ol className="mt-3 space-y-2">
          {order.history.map((h, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <span className={tagClass(h.status)}>{h.status_label}</span>
              <span className="text-slate-600">{formatDate(h.changed_at)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}