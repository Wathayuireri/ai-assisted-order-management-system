import { useState } from "react";
import { api } from '../api/client'; 

export default function AdminChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello Admin! I am your AI assistant. How can I help you manage the store today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // 1. Changed URL to /admin/
      const data = await api('/assistant/admin/', {
        method: 'POST',
        body: { 
            message: userMessage,
            history: messages.slice(-4) // Sending history helps the AI remember the conversation
        }
      });

      // 2. Changed 'data.reply' to 'data.answer' to match Django's response
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error: Could not connect to the AI. Please try again." }]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b bg-gray-50 rounded-t-xl">
        <h1 className="text-xl font-bold text-slate-800">Admin AI Assistant</h1>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-3 rounded-xl ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-slate-800"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-slate-500 p-3 rounded-xl italic">
              AI is typing...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the AI..." 
          className="flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}