const ACCESS = 'crystal_access'
const REFRESH = 'crystal_refresh'

export function getAccess() {
  return localStorage.getItem(ACCESS)
}

export function saveTokens(access, refresh) {
  localStorage.setItem(ACCESS, access)
  if (refresh) localStorage.setItem(REFRESH, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

function messageFrom(data) {
  if (!data) return 'Something went wrong. Please try again.'
  if (typeof data === 'string') return data
  if (data.problems) return [data.detail, ...data.problems].join(' ')
  if (data.detail) return String(data.detail)
  const parts = Object.values(data).map((v) => (Array.isArray(v) ? v.join(' ') : String(v)))
  return parts.join(' ') || 'Something went wrong. Please try again.'
}

export class ApiError extends Error {
  constructor(status, data) {
    super(messageFrom(data))
    this.status = status
    this.data = data
  }
}

async function refreshAccess() {
  const refresh = localStorage.getItem(REFRESH)
  if (!refresh) return false
  const res = await fetch('/api/accounts/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!res.ok) {
    clearTokens()
    return false
  }
  const data = await res.json()
  saveTokens(data.access, data.refresh)
  return true
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  async function send() {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const token = getAccess()
    if (auth && token) headers.Authorization = `Bearer ${token}`
    return fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let res
  try {
    res = await send()
  } catch {
    throw new ApiError(0, { detail: 'Cannot reach the server. Check your connection.' })
  }

  if (res.status === 401 && auth && localStorage.getItem(REFRESH)) {
    if (await refreshAccess()) res = await send()
  }

  let data = null
  if (res.status !== 204) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}