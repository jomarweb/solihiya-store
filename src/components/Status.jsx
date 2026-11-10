import { useStore } from '../lib/store.jsx'

export default function Status({ loading, error }) {
  const { loadProducts } = useStore()
  if (loading) return <p className="status" role="status">Loading the catalog</p>
  if (error) return (
    <div className="status error" role="alert">
      <p>{error}</p>
      <button className="btn ghost small" onClick={loadProducts}>Reload catalog</button>
    </div>
  )
  return null
}
