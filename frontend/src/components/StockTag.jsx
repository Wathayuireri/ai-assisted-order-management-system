export default function StockTag({ product }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {product.stock_status}
    </span>
  )
}