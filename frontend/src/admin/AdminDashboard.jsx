import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/orders/") 
      .then(res => setOrders(res || [])) // res is already the data
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  // Group orders by status
  const groupedOrders = orders.reduce((acc, order) => {
    acc[order.status] = acc[order.status] || [];
    acc[order.status].push(order);
    return acc;
  }, {});

  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Orders Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map(status => (
          <div key={status} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold capitalize text-slate-700 mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                status === 'pending' ? 'bg-yellow-400' :
                status === 'processing' ? 'bg-blue-400' :
                status === 'shipped' ? 'bg-purple-400' :
                status === 'delivered' ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              {status}
            </h2>
            <p className="text-3xl font-bold text-slate-900">
              {groupedOrders[status]?.length || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Orders in this state</p>
          </div>
        ))}
      </div>
    </div>
  );
}