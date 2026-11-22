import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminMessages from "./admin/AdminMessages";
import AdminChat from "./admin/AdminChat";
import AdminProductEdit from "./admin/AdminProductEdit"; // <--- IMPORTED HERE
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
import Receipt from './pages/Receipt';
import Payments from './pages/Payments';
import PaymentWait from './pages/PaymentWait';

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
        
        {/* ❌ REMOVED THE WRONG ROUTE FROM HERE */}

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- CUSTOMER ROUTES --- */}
        <Route path="/cart" element={customer(<Cart />)} />
        <Route path="/checkout" element={customer(<Checkout />)} />
        <Route path="/receipt/:id" element={customer(<Receipt />)} />
        <Route path="/orders" element={customer(<Orders />)} />
        <Route path="/orders/:id" element={customer(<OrderDetail />)} />
        <Route path="/assistant" element={customer(<Assistant />)} />
        <Route path="/payments" element={customer(<Payments />)} />
<Route path="/payment/:id" element={customer(<PaymentWait />)} />

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
          
          {/* ✅ ADDED IT HERE INSIDE THE ADMIN BLOCK */}
          <Route path="products/:id" element={<AdminProductEdit />} /> 

          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="assistant" element={<AdminChat />} /> 
        </Route>
        
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Route>
    </Routes>
  )
}