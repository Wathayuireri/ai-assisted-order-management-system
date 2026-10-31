import { useState } from "react";

export default function AdminChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello Admin! I am your AI assistant. How can I help you manage the store today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI response (You will replace this with an actual API call later)
    setTimeout(() => {
      setMessages([...newMessages, { role: "assistant", text: "I'm a simulated AI right now. Connect my backend endpoint to make me real!" }]);
    }, 1000);
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
      </div>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the AI..." 
          className="flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}