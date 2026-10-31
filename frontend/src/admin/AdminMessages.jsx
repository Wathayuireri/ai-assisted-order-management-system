import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace "/contact/" with the exact URL from your Django backend
    api("/contact/admin/")
      .then(res => setMessages(res || []))
      .catch(err => {
        console.error("Failed to fetch messages:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading messages...</div>;
  if (error) return <div className="text-red-500 bg-red-50 p-4 rounded">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Customer Messages</h1>
      
      {messages.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No customer messages yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-800">{msg.name}</p>
                  <p className="text-sm text-gray-500">{msg.email}</p>
                </div>
              </div>
              <p className="text-slate-600 mt-4">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}