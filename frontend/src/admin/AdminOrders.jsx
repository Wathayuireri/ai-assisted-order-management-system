import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // 1. Import Link
import { api } from "../api/client";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = () => {
    api("/orders/admin/")
      .then((res) => {
        setOrders(res || []);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
        setError(err.message || "Failed to load orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    
    api("/orders/admin/")
      .then((res) => {
        if (!ignore) {
          setOrders(res || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load orders:", err);
          setError(err.message || "Failed to load orders");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api(`/orders/admin/${orderId}/status/`, {
        method: "PATCH",
        body: { status: newStatus }, 
      });
      fetchOrders(); 
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    }
  };

  const handleMarkPaid = async (paymentId) => {
    if (!paymentId) return alert("No payment record found for this order.");
    try {
      await api(`/payments/admin/${paymentId}/status/`, {
        method: "PATCH",
        body: { status: "success" }, 
      });
      fetchOrders(); 
    } catch (err) {
      alert(err.message || "Failed to update payment status.");
    }
  };

  const getNextStatus = (currentStatus) => {
    const flow = ["placed", "confirmed", "processing", "dispatched", "delivered"];
    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex !== -1 && currentIndex < flow.length - 1) {
      return flow[currentIndex + 1];
    }
    return null;
  };

  if (loading) return <div className="p-4 text-gray-500">Loading orders...</div>;
  if (error) return <div className="p-4 text-red-600 font-bold">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Orders Management</h1>
      
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found. Place an order as a customer to see it here.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order / Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {/* 2. Wrap the order reference in a Link */}
                      <Link 
                        to={`/admin/orders/${order.id}`} 
                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                      >
                        {order.reference || `#${order.id}`}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">📍 {order.delivery_location || 'No location'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      KES {order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                        ${order.status === 'placed' ? 'bg-gray-100 text-gray-800' : 
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'dispatched' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                        ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                      {order.payment_status === 'pending' && order.payment_id && (
                        <button
                          onClick={() => handleMarkPaid(order.payment_id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                        >
                          Mark Paid
                        </button>
                      )}

                      {nextStatus && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold capitalize"
                        >
                          Mark as {nextStatus}
                        </button>
                      )}
                      
                      {order.status === 'delivered' && (
                         <span className="text-green-600 font-semibold text-xs py-1">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}