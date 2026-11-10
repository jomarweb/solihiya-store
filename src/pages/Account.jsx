import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, peso } from '../lib/supabase'
import { useStore } from '../lib/store.jsx'

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

export default function Account() {
  const { user, authReady } = useStore()
  const nav = useNavigate()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { if (authReady && !user) nav('/sign-in', { replace: true }) }, [authReady, user, nav])
  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('id, order_no, status, total, created_at, order_items(qty)').order('created_at', { ascending: false })
      .then(({ data, error }) => { if (error) setError('Your orders could not be loaded. Refresh the page to try again.'); else setOrders(data) })
  }, [user])

  if (!user) return <div className="wrap section"><p className="status">Loading your account</p></div>
  return (
    <div className="wrap section account">
      <div className="section-head">
        <div>
          <h1>Your account</h1>
          <p className="muted">{user.user_metadata?.full_name ? `${user.user_metadata.full_name}, ` : ''}{user.email}</p>
        </div>
        <button className="btn ghost small" onClick={async () => { await supabase.auth.signOut(); nav('/') }}>Sign out</button>
      </div>
      <h2>Orders</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!orders && !error && <p className="status">Loading your orders</p>}
      {orders?.length === 0 && (
        <div className="empty">
          <p>You have not placed an order yet.</p>
          <Link className="btn" to="/shop">Browse furniture</Link>
        </div>
      )}
      {orders?.length > 0 && (
        <table className="orders">
          <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/orders/${o.id}`}>{o.order_no}</Link></td>
                <td>{fmtDate(o.created_at)}</td>
                <td>{o.order_items.reduce((n, i) => n + i.qty, 0)}</td>
                <td><span className="chip">{o.status}</span></td>
                <td className="num">{peso(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
