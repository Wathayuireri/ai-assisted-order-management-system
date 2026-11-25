import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Alert from '../components/Alert'
import PaymentPanel from '../components/PaymentPanel'
import { card } from '../components/ui'
import { formatDate, kes, tagClass } from '../utils/format'

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'dispatched', 'delivered'];

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')



  const load = useCallback(() => {
    // Use the admin endpoint here:
    api(`/orders/admin/${id}/`).then(setOrder).catch((e) => setError(e.message))
  }, [id])


  useEffect(() => {
    load()
  }, [load])

  if (error) return <Alert>{error}</Alert>
  if (!order) return <p>Loading...</p>

  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-4">
      {/* CHANGE: Link back to the admin orders list */}
      <Link to="/admin/orders" className="text-sm font-semibold text-brand">
        &larr; Back to Orders Management
      </Link>
      
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{order.reference}</h1>
          <div className="flex gap-2">
            <span className={tagClass(order.status)}>{order.status_label || order.status}</span>
            <span className={tagClass(order.payment_status)}>{order.payment_status}</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Placed {formatDate(order.created_at)}. Contact phone: {order.contact_phone}
        </p>
        {order.notes && <p className="mt-2 text-sm">Notes: {order.notes}</p>}
      </div>

      <div className={card}>
        <h2 className="text-lg font-bold mb-6">Order Progress</h2>
        
        {isCancelled ? (
          <div className="text-red-600 font-bold p-4 bg-red-50 rounded border border-red-200">
            This order was cancelled.
          </div>
        ) : (
          <div className="flex justify-between items-center relative mb-4">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
            
            <div 
              className="absolute left-0 top-1/2 h-1 bg-green-500 -z-10 transition-all duration-500 transform -translate-y-1/2" 
              style={{ width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            ></div>

            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={step} className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`mt-3 text-xs font-semibold capitalize ${
                    isCurrent ? 'text-green-600' : isCompleted ? 'text-slate-800' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={card}>
        <h2 className="text-lg font-bold mb-4">Items</h2>
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between border-b border-slate-200 py-2 text-sm last:border-0">
            <span>{i.quantity} x {i.product_name} ({kes(i.unit_price)})</span>
            <b>{kes(i.line_total)}</b>
          </div>
        ))}
        <div className="mt-3 flex justify-between text-lg"><b>Total</b><b>{kes(order.total_amount)}</b></div>
      </div>

      {/* Admin might not need the payment panel here since they have "Mark Paid" in the table, 
          but you can leave it if you want them to see it. */}
      {!order.is_paid && order.status !== 'cancelled' && (
        <PaymentPanel order={order} onPaid={load} />
      )}
    </div>
  )
}