import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Placeholder from './pages/Placeholder'

function customer(title) {
  return (
    <ProtectedRoute role="customer">
      <Placeholder title={title} />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Placeholder title="Products" />} />
        <Route path="/products/:id" element={<Placeholder title="Product details" />} />
        <Route path="/contact" element={<Placeholder title="Contact us" />} />
        <Route path="/login" element={<Placeholder title="Sign in" />} />
        <Route path="/register" element={<Placeholder title="Register" />} />
        <Route path="/cart" element={customer('Your cart')} />
        <Route path="/checkout" element={customer('Checkout')} />
        <Route path="/orders" element={customer('My orders')} />
        <Route path="/orders/:id" element={customer('Order details')} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Placeholder title="Admin dashboard" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Route>
    </Routes>
  )
}