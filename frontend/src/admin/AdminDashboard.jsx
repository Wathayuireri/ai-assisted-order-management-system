import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/orders/admin/")
      .then((res) => setOrders(res || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading dashboard...</div>;

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const Card = ({ title, count, color }) => (
    <Link to="/admin/orders" className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-3 h-3 rounded-full ${color}`}></span>
        <h2 className="text-gray-600 font-medium">{title}</h2>
      </div>
      <p className="text-4xl font-bold text-slate-800">{count}</p>
      <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
    </Link>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Orders Dashboard</h1>
      {/* Responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card title="Pending" count={stats.pending} color="bg-yellow-400" />
        <Card title="Processing" count={stats.processing} color="bg-blue-400" />
        <Card title="Shipped" count={stats.shipped} color="bg-purple-400" />
        <Card title="Delivered" count={stats.delivered} color="bg-green-400" />
        <Card title="Cancelled" count={stats.cancelled} color="bg-red-400" />
      </div>
      <div className="mt-8">
        <Link to="/admin/orders" className="text-blue-600 hover:underline font-medium">
          View all orders &rarr;
        </Link>
      </div>
    </div>
  );
}