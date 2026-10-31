import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

const CartContext = createContext(null)
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)

  const refresh = useCallback(async () => {
    if (user?.role !== 'customer') {
      setCart(null)
      return null
    }
    try {
      const data = await api('/cart/')
      setCart(data)
      return data
    } catch {
      return null
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addItem(productId, quantity = 1) {
    const data = await api('/cart/items/', {
      method: 'POST',
      body: { product: productId, quantity },
    })
    setCart(data)
    return data
  }

  async function setQuantity(itemId, quantity) {
    const data = await api(`/cart/items/${itemId}/`, { method: 'PATCH', body: { quantity } })
    setCart(data)
    return data
  }

  async function removeItem(itemId) {
    const data = await api(`/cart/items/${itemId}/`, { method: 'DELETE' })
    setCart(data)
    return data
  }

  async function clearCart() {
    const data = await api('/cart/', { method: 'DELETE' })
    setCart(data)
    return data
  }

  return (
    <CartContext.Provider value={{ cart, refresh, addItem, setQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}