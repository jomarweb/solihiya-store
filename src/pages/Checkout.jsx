import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { peso } from '../lib/supabase'
import { useStore } from '../lib/store.jsx'
import Photo from '../components/Photo.jsx'

const PAYMENTS = ['Cash on delivery', 'GCash on delivery', 'Bank transfer']

export default function Checkout() {
  const { user, authReady, lines, subtotal, shipping, total, clear, loadProducts, loading } = useStore()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', province: '', postal: '', notes: '' })
  const [payment, setPayment] = useState(PAYMENTS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => { if (authReady && !user) nav('/sign-in?next=/checkout', { replace: true }) }, [authReady, user, nav])
  useEffect(() => {
    if (user?.user_metadata?.full_name) setForm((f) => (f.name ? f : { ...f, name: user.user_metadata.full_name }))
  }, [user])

  if (!authReady || loading || !user) return <div className="wrap section"><p className="status">Loading checkout</p></div>
  if (lines.length === 0 && !busy) {
    return (
      <div className="wrap section narrow center">
        <h1>Your cart is empty</h1>
        <p className="lede">Add a piece to your cart to check out.</p>
        <Link className="btn" to="/shop">Browse furniture</Link>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { data, error } = await supabase.rpc('place_order', {
      p_items: lines.map((l) => ({ product_id: l.id, qty: l.qty })),
      p_shipping: form,
      p_payment: payment,
    })
    if (error) {
      setError(error.message.includes('stock') ? error.message : 'The order could not be placed. Check your details and try again.')
      setBusy(false)
      loadProducts()
      return
    }
    clear()
    loadProducts()
    nav(`/orders/${data}?placed=1`, { replace: true })
  }

  return (
    <div className="wrap checkout">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form className="form" onSubmit={submit}>
          <h2>Delivery address</h2>
          <label>Full name<input required autoComplete="name" value={form.name} onChange={on('name')} /></label>
          <label>Mobile number<input required type="tel" autoComplete="tel" placeholder="0917 123 4567" value={form.phone} onChange={on('phone')} /></label>
          <label>Street address<input required autoComplete="street-address" placeholder="House number, street, barangay" value={form.address} onChange={on('address')} /></label>
          <div className="two">
            <label>City or municipality<input required autoComplete="address-level2" value={form.city} onChange={on('city')} /></label>
            <label>Province<input required autoComplete="address-level1" value={form.province} onChange={on('province')} /></label>
          </div>
          <label className="short">Postal code<input required inputMode="numeric" pattern="[0-9]{4}" title="Four digits" autoComplete="postal-code" value={form.postal} onChange={on('postal')} /></label>
          <label>Delivery notes, optional<textarea rows="2" value={form.notes} onChange={on('notes')} /></label>

          <h2>Payment</h2>
          <fieldset className="pay">
            <legend className="sr">Payment method</legend>
            {PAYMENTS.map((m) => (
              <label key={m} className={payment === m ? 'on' : ''}>
                <input type="radio" name="pay" checked={payment === m} onChange={() => setPayment(m)} /> {m}
              </label>
            ))}
          </fieldset>
          <p className="muted">This is a demo store. No payment is taken and nothing ships.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Placing order' : `Place order, ${peso(total)}`}</button>
        </form>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="lines compact">
            {lines.map(({ product: p, qty }) => (
              <li key={p.id}>
                <Photo src={p.image} alt="" w={120} h={120} />
                <div className="line-info"><span>{p.name}</span><span className="muted">Qty {qty}</span></div>
                <strong>{peso(p.price * qty)}</strong>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{peso(subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>{shipping ? peso(shipping) : 'Free'}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{peso(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
