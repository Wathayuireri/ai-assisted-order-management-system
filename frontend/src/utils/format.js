export function kes(value) {
  return `KES ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
}

const colours = {
  placed: 'bg-slate-100 text-slate-800',
  confirmed: 'bg-blue-100 text-blue-900',
  processing: 'bg-amber-100 text-amber-900',
  dispatched: 'bg-indigo-100 text-indigo-900',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-900',
  failed: 'bg-red-100 text-red-800',
  unpaid: 'bg-slate-100 text-slate-800',
}

export function tagClass(key) {
  return `rounded-full px-2 py-1 text-xs font-semibold ${colours[key] || colours.placed}`
}