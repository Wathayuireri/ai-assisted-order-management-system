import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminMessages from "./admin/AdminMessages";
import AdminChat from "./admin/AdminChat";
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import About from './pages/About'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Login from './pages/Login'
import OrderDetail from './pages/OrderDetail'
import Orders from './pages/Orders'
import Placeholder from './pages/Placeholder'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Register from './pages/Register'
import Assistant from './pages/Assistant' 

function customer(element) {
  return <ProtectedRoute role="customer">{element}</ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- CUSTOMER ROUTES --- */}
        <Route path="/cart" element={customer(<Cart />)} />
        <Route path="/checkout" element={customer(<Checkout />)} />
        <Route path="/orders" element={customer(<Orders />)} />
        <Route path="/orders/:id" element={customer(<OrderDetail />)} />
        
        {/* ✅ MOVED HERE: The Customer Assistant route */}
        <Route path="/assistant" element={customer(<Assistant />)} />

        {/* --- ADMIN ROUTES --- */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          
          {/* Note: I changed this to 'assistant' to match your sidebar link */}
          <Route path="assistant" element={<AdminChat />} /> 
        </Route>
        
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Route>
    </Routes>
  )
}