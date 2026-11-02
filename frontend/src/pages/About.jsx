import { Link } from 'react-router-dom'

const range = [
  { title: 'Chemicals', text: 'Chemicals for businesses and institutions, including specialised products.' },
  { title: 'Cleaning products', text: 'General and specialised cleaning products for homes and workplaces.' },
  { title: 'Disinfectants', text: 'Disinfectants for keeping homes, shops and institutions clean and safe.' },
]

export default function About() {
  return (
    <div className="space-y-14">
      <section
        className="rounded-2xl px-6 py-12 text-white sm:px-12"
        style={{ background: 'linear-gradient(135deg, #084C7E, #0B6FB5)' }}
      >
        <h1 className="text-4xl font-bold">About Crystal Chemicals</h1>
        <p className="mt-3 max-w-2xl text-lg text-sky-100">
          A chemical manufacturing company based in Nairobi, supplying individuals and
          businesses across Kenya.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Who we are</h2>
          <p className="mt-3 text-slate-700">
            Crystal Chemicals makes chemicals, general and specialised cleaning products and
            disinfectants. Our customers include individuals and businesses, from households to
            institutions.
          </p>
          <p className="mt-3 text-slate-700">
            [Add a short history of the company here, for example when it started and what it
            stands for.]
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Why we built this website</h2>
          <p className="mt-3 text-slate-700">
            Ordering used to mean choosing items, waiting for a quotation and then phoning us
            during working hours. Now you can order and pay at any time, and follow your order
            until it is delivered.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">What we make</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {range.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 h-10 w-10 rounded-lg bg-sky-100" />
              <h3 className="text-lg font-semibold">{r.title}</h3>
              <p className="mt-1 text-slate-600">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Visit or contact us</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-slate-600">Address</dt>
            <dd>[Add the company address, Nairobi]</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-600">Phone</dt>
            <dd>[Add a phone number]</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-600">Email</dt>
            <dd>[Add an email address]</dd>
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