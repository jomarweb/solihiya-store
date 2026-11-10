import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase, peso } from '../lib/supabase'
import { useStore } from '../lib/store.jsx'
import Photo from '../components/Photo.jsx'
import { fmtDate } from './Account.jsx'

export default function Order() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { user, authReady } = useStore()
  const nav = useNavigate()
  const [order, setOrder] = useState(undefined)

  useEffect(() => { if (authReady && !user) nav('/sign-in', { replace: true }) }, [authReady, user, nav])
  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle().then(({ data }) => setOrder(data))
  }, [user, id])

  if (order === undefined) return <div className="wrap section"><p className="status">Loading your order</p></div>
  if (!order) return (
    <div className="wrap section narrow center">
      <h1>Order not found</h1>
      <p className="lede">This order is not on your account.</p>
      <Link className="btn" to="/account">See your orders</Link>
    </div>
  )
  return (
    <div className="wrap section order">
      {sp.get('placed') && (
        <div className="placed" role="status">
          <h1>Order placed</h1>
          <p className="lede">Thank you, {order.ship_name.split(' ')[0]}. Your order number is {order.order_no}.</p>
        </div>
      )}
      {!sp.get('placed') && <h1>Order {order.order_no}</h1>}
      <p className="muted">Placed {fmtDate(order.created_at)} <span className="chip">{order.status}</span></p>
      <div className="checkout-grid">
        <div>
          <ul className="lines compact">
            {order.order_items.map((i) => (
              <li key={i.id}>
                <Photo src={i.image} alt="" w={120} h={120} />
                <div className="line-info"><span>{i.name}</span><span className="muted">{peso(i.unit_price)} each, qty {i.qty}</span></div>
                <strong>{peso(i.unit_price * i.qty)}</strong>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{peso(order.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>{order.shipping_fee ? peso(order.shipping_fee) : 'Free'}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{peso(order.total)}</dd></div>
          </dl>
        </div>
        <aside className="summary">
          <h2>Delivering to</h2>
          <p>{order.ship_name}<br />{order.ship_address}<br />{order.ship_city}, {order.ship_province} {order.ship_postal}<br />{order.ship_phone}</p>
          <h2>Payment</h2>
          <p>{order.payment_method}</p>
          {order.notes && <><h2>Delivery notes</h2><p>{order.notes}</p></>}
        </aside>
      </div>
      <p className="after"><Link className="btn ghost" to="/account">See all orders</Link> <Link className="btn" to="/shop">Keep shopping</Link></p>
    </div>
  )
}
