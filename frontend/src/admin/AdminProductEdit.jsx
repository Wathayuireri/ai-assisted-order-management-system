import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import Alert from '../components/Alert';

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null); // NEW: State to hold the file
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/products/${id}/`).then(setFormData).catch(err => setError(err.message));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      // We use FormData instead of JSON because we are sending a file
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('stock_quantity', formData.stock_quantity);
      data.append('pack_size', formData.pack_size || '');
      data.append('description', formData.description || '');
      data.append('intended_use', formData.intended_use || '');
      
      // Only append the image if the admin selected a new one
      if (imageFile) {
        data.append('image', imageFile);
      }

      // Send the form data to Django (Notice we don't set Content-Type; the browser does it for us)
      const token = localStorage.getItem('crystal_access');
      const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
          // DO NOT set 'Content-Type' to 'application/json' here!
        },
        body: data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!formData) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <Link to="/admin/products" className="text-sm font-semibold text-blue-600 hover:underline">
          &larr; Back to products
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Product</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        
        {/* IMAGE UPLOAD SECTION */}
        <div className="border p-4 rounded bg-gray-50">
          <label className="block text-sm font-medium mb-2">Current Image</label>
          {formData.image ? (
            <img src={`http://127.0.0.1:8000${formData.image}`} alt="Product" className="h-32 w-32 object-cover rounded mb-3" />
          ) : (
            <div className="h-32 w-32 bg-gray-200 flex items-center justify-center rounded mb-3 text-sm text-gray-500">No Image</div>
          )}
          
          <label className="block text-sm font-medium mb-1">Upload New Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input required className="border p-2 rounded w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (KES)</label>
          <input required type="number" className="border p-2 rounded w-full" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock Quantity</label>
          <input required type="number" className="border p-2 rounded w-full" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pack Size</label>
          <input className="border p-2 rounded w-full" value={formData.pack_size || ''} onChange={e => setFormData({...formData, pack_size: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea rows="3" className="border p-2 rounded w-full" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={busy} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="border border-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}