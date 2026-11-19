import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { kes } from '../utils/format';

export default function Receipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch the payment details using the payment ID from the URL
    api(`/payments/${id}/`)
      .then(setPayment)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-600 text-center font-bold">Error: {error}</div>;
  if (!payment) return <p className="p-8 text-center text-slate-500">Loading receipt...</p>;

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      
      {/* Green Checkmark Icon */}
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Payment Successful</h1>
      <p className="text-center text-slate-500 mb-8">Thank you for shopping with Crystal Chemicals.</p>

      {/* Receipt Details */}
      <div className="bg-slate-50 rounded-lg p-5 space-y-3 mb-8 border border-slate-200">
        <div className="flex justify-between border-b border-slate-200 pb-3">
          <span className="text-slate-500">Order Reference</span>
          <span className="font-bold text-slate-800">{payment.order_reference || 'N/A'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-3">
          <span className="text-slate-500">Amount Paid</span>
          <span className="font-bold text-green-600 text-lg">{kes(payment.amount)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-200 pb-3">
          <span className="text-slate-500">Payment Method</span>
          <span className="font-semibold text-slate-800">
            {payment.phone === 'CARD' ? 'Visa / Mastercard' : 'M-PESA'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Receipt No.</span>
          <span className="font-mono text-slate-800">{payment.mpesa_receipt || 'N/A'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link to="/products" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-center transition-colors">
          Continue Shopping
        </Link>
        <Link to="/orders" className="block w-full border border-gray-300 hover:bg-gray-50 text-slate-700 font-bold py-3 rounded-lg text-center transition-colors">
          View My Orders
        </Link>
        <button 
          onClick={() => window.print()} 
          className="block w-full bg-slate-800 hover:bg-black text-white font-bold py-3 rounded-lg text-center transition-colors mt-2"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}