import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import StockTag from '../components/StockTag'
import { kes } from '../utils/format'

const benefits = [
  {
    title: 'Order any time',
    text: 'Browse and order day or night. No phone call and no waiting for a quotation.',
  },
  {
    title: 'Pay with M-Pesa',
    text: 'Pay from your phone with the mobile money you already use.',
  },
  {
    title: 'Track every order',
    text: 'See each order move from placed to delivered, all in one place.',
  },
]

export default function Home() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api('/categories/', { auth: false }).then(setCategories).catch(() => {})
    api('/products/', { auth: false })
      .then((data) => setFeatured(data.filter((p) => p.in_stock).slice(0, 4)))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-14 text-white sm:px-12 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #084C7E, #0B6FB5)' }}
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">
            Crystal Chemicals, Nairobi
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Cleaning products, disinfectants and chemicals, ordered in minutes
          </h1>
          <p className="mt-4 text-lg text-sky-100">
            Choose your products, pay with M-Pesa and follow your order online. For homes,
            shops and institutions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-sky-50"
            >
              Shop products
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Shop by category</h2>
          <p className="mt-1 text-slate-600">Find the right product for the job.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-brand hover:shadow-sm"
              >
                <div className="mb-3 h-10 w-10 rounded-lg bg-sky-100" />
                <p className="text-lg font-semibold group-hover:text-brand">{c.name}</p>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                )}
                <p className="mt-3 text-sm font-semibold text-brand">Browse {c.name.toLowerCase()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">Available now</h2>
              <p className="mt-1 text-slate-600">A few products you can order today.</p>
            </div>
            <Link to="/products" className="font-semibold text-brand">View all products</Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="mb-3 h-28 w-full rounded-lg object-cover" />
                ) : (
                  <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-sky-100 text-sm text-slate-600">
                    No image
                  </div>
                )}
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-600">{p.pack_size}</p>
                <div className="mt-3 flex items-center justify-between">
                  <b>{kes(p.price)}</b>
                  <StockTag product={p} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Benefits */}
      <section>
        <h2 className="text-2xl font-bold">Why order online</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {benefits.map((b, index) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
              <p className="mt-1 text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="rounded-2xl bg-sky-100 px-6 py-10 text-center sm:px-12">
        <h2 className="text-2xl font-bold text-brand-dark">Ready to place your first order?</h2>
        <p className="mt-2 text-slate-700">
          {user
            ? 'Browse the full range and add what you need to your cart.'
            : 'Create a free account and order in a few clicks.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!user && (
            <Link to="/register" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Create an account
            </Link>
          )}
          <Link
            to="/products"
            className={
              user
                ? 'rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark'
                : 'rounded-lg border border-brand px-6 py-3 font-semibold text-brand hover:bg-white'
            }
          >
            Browse products
          </Link>
        </div>
      </section>
    </div>
  )
}