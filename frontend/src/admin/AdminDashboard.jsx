import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // FIXED: Added /admin/ to the path to match Django's urls.py
    api("/orders/admin/")
      .then((res) => {
        setOrders(res || []);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats:", err);
        setError(err.message || "Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading dashboard...</div>;
  
  if (error) return <div className="p-4 text-red-600 font-bold">Error: {error}</div>;

  // Calculate how many orders are in each status
  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Orders Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <h2 className="text-gray-600 font-medium">Pending</h2>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.pending}</p>
          <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
        </div>

        {/* Processing Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <h2 className="text-gray-600 font-medium">Processing</h2>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.processing}</p>
          <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
        </div>

        {/* Shipped Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-purple-400"></span>
            <h2 className="text-gray-600 font-medium">Shipped</h2>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.shipped}</p>
          <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
        </div>

        {/* Delivered Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <h2 className="text-gray-600 font-medium">Delivered</h2>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.delivered}</p>
          <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <h2 className="text-gray-600 font-medium">Cancelled</h2>
          </div>
          <p className="text-4xl font-bold text-slate-800">{stats.cancelled}</p>
          <p className="text-sm text-gray-500 mt-2">Orders in this state</p>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/admin/orders" className="text-blue-600 hover:underline font-medium">
          View all orders &rarr;
        </Link>
      </div>
    </div>
  );
}