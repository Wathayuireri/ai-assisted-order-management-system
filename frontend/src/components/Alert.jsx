export default function Alert({ kind = 'error', children }) {
  if (!children) return null
  const styles = kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
  return (
    <p role="alert" className={`rounded-lg p-3 text-sm ${styles}`}>
      {children}
    </p>
  )
}