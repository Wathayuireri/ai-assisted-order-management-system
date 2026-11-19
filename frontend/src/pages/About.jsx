import { Link } from 'react-router-dom'

const specializations = [
  'Horticultural cleaning products',
  'Aviation cleaning products',
  'Specialized cleaning products',
  'Pharmaceutical cleaning products',
  'Personal and home care cleaning products',
  'Water treatment products',
]

export default function About() {
  return (
    <div className="space-y-14">
      {/* Hero Section */}
      <section
        className="rounded-2xl px-6 py-12 text-white sm:px-12"
        style={{ background: 'linear-gradient(135deg, #084C7E, #0B6FB5)' }}
      >
        <h1 className="text-4xl font-bold">About Crystal Chemicals</h1>
        <p className="mt-3 max-w-2xl text-lg text-sky-100">
          A chemical manufacturing company based in Nairobi, supplying individuals and businesses across Kenya.
        </p>
      </section>

      {/* Who We Are Section */}
      <section className="grid gap-8 md:grid-cols-1">
        <div>
          <h2 className="text-2xl font-bold">Who we are</h2>
          <p className="mt-3 text-slate-700">
            Crystal Chemical Company Limited was established in 1987. The objective of the company is to cater for the market potential for chemicals, cleaning products, and disinfectants.
          </p>
          <p className="mt-3 text-slate-700">
            The company has a wide range of products that are used in various sectors of the economy. Our customers include individuals and businesses, from households to large institutions across Kenya.
          </p>
        </div>
      </section>

      {/* Specializations Section */}
      <section>
        <h2 className="text-2xl font-bold">What we specialize in</h2>
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {specializations.map((item, index) => (
              <li key={index} className="px-6 py-4 text-slate-700 font-medium">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Visit or contact us</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-slate-600">Address</dt>
            <dd className="mt-1 text-slate-800">P.O. Box 12345, Nairobi, Kenya</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-600">Phone</dt>
            <dd className="mt-1 text-slate-800">+254 700 000 000</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-600">Email</dt>
            <dd className="mt-1 text-slate-800">info@crystalchemicals.co.ke</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/contact" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark">
            Send us a message
          </Link>
          <Link to="/products" className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50">
            Browse products
          </Link>
        </div>
      </section>
    </div>
  )
}