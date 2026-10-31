import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: "", price: "", stock: "", description: "", category: "" });

  const fetchProducts = () => {
    api("/products/").then(res => setProducts(res || []));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddProduct = (e) => {
    e.preventDefault();
    // Pass method and body in the second argument
    api("/products/", { method: "POST", body: formData }).then(() => {
      fetchProducts();
      setFormData({ name: "", price: "", stock: "", description: "", category: "" });
    });
  };

  const handleUpdateStock = (id, newStock) => {
    // Pass method and body in the second argument
    api(`/products/${id}/`, { method: "PATCH", body: { stock: newStock } }).then(fetchProducts);
  };
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Product & Stock Management</h1>
      
      {/* Add Product Form */}
      <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input required className="border p-2 rounded w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input required type="number" className="border p-2 rounded w-full" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input required type="number" className="border p-2 rounded w-full" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Add Product
        </button>
      </form>

      {/* Product List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Price</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">${p.price}</td>
                <td className="p-4">
                  <input type="number" defaultValue={p.stock} onBlur={(e) => handleUpdateStock(p.id, e.target.value)} className="border p-1 w-20 rounded" />
                </td>
                <td className="p-4 text-sm text-blue-600 cursor-pointer hover:underline">Edit details</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}