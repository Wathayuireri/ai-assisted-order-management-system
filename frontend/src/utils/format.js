export function kes(value) {
  return `KES ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
}