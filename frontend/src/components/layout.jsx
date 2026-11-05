import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'

const tab = ({ isActive }) =>
  `border-b-4 px-1 py-5 ${
    isActive ? 'border-white text-white' : 'border-transparent text-sky-100 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const { pathname } = useLocation()
  
  const isCustomer = user?.role === 'customer'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col relative">
      <header className="bg-brand-dark text-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4">
          <Link to="/" className="py-4 text-xl font-bold">
            Crystal Chemicals
          </Link>
          <NavLink to="/" end className={tab}>Home</NavLink>
          <NavLink to="/products" className={tab}>Products</NavLink>
          <NavLink to="/about" className={tab}>About us</NavLink>
          <NavLink to="/contact" className={tab}>Contact us</NavLink>
          
          {/* The Assistant tab is removed from here */}

          {isCustomer && <NavLink to="/orders" className={tab}>My orders</NavLink>}
          {isAdmin && <NavLink to="/admin" className={tab}>Admin</NavLink>}
          <span className="flex-1" />
          {!isAdmin && (
            <NavLink to="/cart" className={tab}>
              Cart{isCustomer ? ` (${cart?.item_count ?? 0})` : ''}
            </NavLink>
          )}
          {user ? (
            <>
              <span className="hidden text-sm sm:inline">{user.first_name || user.email}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-white/60 px-3 py-2 text-sm hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-dark"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-brand-dark text-sky-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
          <p>Crystal Chemicals, Nairobi. Chemicals, cleaning products and disinfectants.</p>
          <div className="flex gap-5">
            <Link to="/products" className="hover:text-white">Products</Link>
            <Link to="/about" className="hover:text-white">About us</Link>
            <Link to="/contact" className="hover:text-white">Contact us</Link>
          </div>
        </div>
      </footer>

      {/* FLOATING ASSISTANT BUTTON */}
      {isCustomer && pathname !== '/assistant' && (
        <Link
          to="/assistant"
          style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}
          className="flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-xl hover:bg-blue-700 transition-transform hover:scale-110"
          title="Ask the assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </Link>
      )}
    </div>
  )
}