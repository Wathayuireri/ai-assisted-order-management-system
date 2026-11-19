import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black">Crystal chemicals management system</h1>
        <p className="mt-2 text-black font-bold "> Admin Dashboard</p>
      </div>
      
      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Products Card */}
        <Link to="/admin/products" className="bg-blue-600 p-6 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer text-white">
          <h2 className="text-xl font-bold mb-2">Products & Stock</h2>
          <p className="text-blue-100">Add, edit, and manage your product catalogue and inventory levels.</p>
        </Link>
        
        {/* Orders Card */}
        <Link to="/admin/orders" className="bg-blue-600 p-6 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer text-white">
          <h2 className="text-xl font-bold mb-2">Orders</h2>
          <p className="text-blue-100">View and update the status of customer orders.</p>
        </Link>

        {/* Messages Card */}
        <Link to="/admin/messages" className="bg-blue-600 p-6 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer text-white">
          <h2 className="text-xl font-bold mb-2">Messages</h2>
          <p className="text-blue-100">Read and reply to customer inquiries.</p>
        </Link>

        {/* AI Assistant Card */}
        <Link to="/admin/assistant" className="bg-blue-600 p-6 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer text-white">
          <h2 className="text-xl font-bold mb-2">AI Assistant</h2>
          <p className="text-blue-100">Ask the AI questions about stock and orders.</p>
        </Link>

      </div>
    </div>
  );
}