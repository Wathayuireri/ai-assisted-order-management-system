import { Link } from 'react-router-dom'
import { kes } from '../utils/format'
import { primary } from './ui'

export default function ProductCard({ product, role, busy, onAdd }) {
  const out = !product.in_stock
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
      <Link to={`/products/${product.id}`} className="block">
        
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="mb-3 h-28 w-full rounded-lg object-cover bg-gray-100" 
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; 
            }} 
          />
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-sky-100 text-sm text-slate-600">
            No image
          </div>
        )}
        
        <p className="font-semibold">{product.name}</p>
      </Link>
      <p className="text-sm text-slate-600">{product.pack_size}</p>
      
      <div className="my-3 flex items-center justify-between">
        <b>{kes(product.price)}</b>
        {/* Shows ONLY if out of stock */}
        {out && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            Out of Stock
          </span>
        )}
      </div>

      {role !== 'admin' && (
        <button
          disabled={out || busy}
          onClick={() => onAdd(product)}
          className={`${primary} mt-auto w-full`}
        >
          {out ? 'Out of stock' : busy ? 'Adding...' : 'Add to cart'}
        </button>
      )}
    </div>
  )
}