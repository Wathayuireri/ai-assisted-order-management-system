import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function PaymentWait() {
  const { id } = useParams() // This is the Order ID
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')

  useEffect(() => {
    // Poll the backend every 3 seconds to check if payment is complete
    const timer = setInterval(async () => {
      try {
        const res = await api(`/orders/${id}/`)
        
        if (res.status === 'placed') {
          setStatus('success')
          clearInterval(timer)
          // Redirect to receipt after 2 seconds
          setTimeout(() => navigate(`/receipt/${id}`), 2000)
        } else if (res.status === 'failed' || res.status === 'cancelled') {
          setStatus('failed')
          clearInterval(timer)
          setError('Payment failed or was cancelled.')
        }
      } catch (err) {
        console.error("Error checking status:", err)
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [id, navigate])

  return (
    <div className="max-w-md mx-auto mt-20 text-center px-4">
      {status === 'pending' ? (
        <>
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Check your phone</h1>
          <p className="text-gray-600 mb-8">Please enter your M-PESA PIN to complete the payment.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </>
      ) : status === 'success' ? (
        <>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="text-gray-600">Redirecting to your receipt...</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/payments" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Try Again
          </Link>
        </>
      )}
      
      <Link to="/" className="block mt-8 text-red-500 font-semibold hover:underline">
        Cancel & Return Home
      </Link>
    </div>
  )
}