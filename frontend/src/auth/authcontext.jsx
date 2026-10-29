import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearTokens, getAccess, saveTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!getAccess()) {
        setLoading(false)
        return
      }
      try {
        const me = await api('/accounts/me/')
        if (active) setUser(me)
      } catch {
        clearTokens()
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api('/accounts/login/', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    saveTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (details) => {
      await api('/accounts/register/', { method: 'POST', body: details, auth: false })
      return login(details.email, details.password)
    },
    [login],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}