import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = () => {
    // We added /admin/ to match your urls.py
    api("/contact/admin/") 
      .then(res => setMessages(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); }, []);

  const toggleReadStatus = (id, currentStatus) => {
    // This hits /api/contact/admin/<id>/ which we saw in your urls.py
    api(`/contact/admin/${id}/`, { 
      method: "PATCH", 
      body: { is_read: !currentStatus } 
    }).then(fetchMessages)
      .catch(err => alert(err.message));
  };

  if (loading) return <div className="p-4 text-gray-500">Loading messages...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Customer Messages</h1>
      
      <div className="grid gap-4">
        {messages.length === 0 ? (
           <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-6 rounded-xl shadow-sm border transition-colors ${msg.is_read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-300'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-800">
                    {msg.name} <span className="text-sm font-normal text-gray-500">({msg.email})</span>
                  </p>
                </div>
                <button 
                  onClick={() => toggleReadStatus(msg.id, msg.is_read)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${msg.is_read ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  {msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
              </div>
              <p className="text-slate-600 mt-4">{msg.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}