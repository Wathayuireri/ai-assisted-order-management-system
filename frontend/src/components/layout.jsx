import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const tab = ({ isActive }) =>
  `border-b-4 px-1 py-5 ${
    isActive ? 'border-white text-white' : 'border-transparent text-sky-100 hover:text-white'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const isCustomer = user?.role === 'customer'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen">
      <header className="bg-brand-dark text-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4">
          <Link to="/" className="py-4 text-xl font-bold">
            Crystal Chemicals
          </Link>
          <NavLink to="/" end className={tab}>Home</NavLink>
          <NavLink to="/products" className={tab}>Products</NavLink>
          {isCustomer && <NavLink to="/orders" className={tab}>My orders</NavLink>}
          <NavLink to="/contact" className={tab}>Contact us</NavLink>
          {isAdmin && <NavLink to="/admin" className={tab}>Admin</NavLink>}
          <span className="flex-1" />
          {isCustomer && <NavLink to="/cart" className={tab}>Cart</NavLink>}
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}