import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api('/categories/', { auth: false }).then(setCategories).catch(() => {})
  }, [])

  const shopNowLink = user ? "/products" : "/login";

  return (
    /* 
      The negative margins (-mx-4 -mt-8) pull this container out of the Layout's max-width box, 
      making it span the full width of the screen. 
      The min-h-screen ensures it covers the whole screen height.
      The mb-8 offsets the bottom margin so the footer looks right.
    */
    <div 
      className="relative -mx-4 -mt-8 mb-8 min-h-[calc(100vh-80px)] flex flex-col items-center pt-24 pb-16 bg-cover bg-center bg-fixed"
      style={{ 
        // REPLACE THIS WITH YOUR ACTUAL IMAGE PATH
        backgroundImage: "url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop')" 
      }}
    >
      {/* Dark overlay so the white text and cards stand out */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <div className="text-center mb-16 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Welcome to Crystal Chemicals!
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 drop-shadow-md">
            Your trusted partner in chemical manufacturing. High-quality cleaning products and disinfectants for homes and industries.
          </p>
          <Link 
            to={shopNowLink}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-lg"
          >
            Shop Now
          </Link>
        </div>

        {/* CATEGORIES SECTION (Now sitting directly on the background) */}
        {categories.length > 0 && (
          <div className="w-full">
            {/* Removed the text here as requested */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/products?category=${c.id}`}
                  className="group rounded-xl bg-white p-5 hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  {c.image ? (
                   
    <img 
  src={c.image} 
  alt={c.name} 
  className="mb-3 h-32 w-full rounded-lg object-cover bg-gray-100" 
/>
                    
                  ) : (
                    <div className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-sky-100 text-sm text-slate-500">
                      No Image
                    </div>
                  )}

                  <p className="text-lg font-semibold text-slate-800 group-hover:text-blue-600">{c.name}</p>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-blue-600">Browse {c.name.toLowerCase()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}