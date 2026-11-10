import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { peso, FREE_SHIPPING_FROM } from '../lib/supabase'
import Photo from './Photo.jsx'
import Qty from './Qty.jsx'

export default function CartDrawer() {
  const { cartOpen, setCartOpen, lines, subtotal, shipping, total, setQty, remove } = useStore()
  const nav = useNavigate()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!cartOpen) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [cartOpen, setCartOpen])

  const left = FREE_SHIPPING_FROM - subtotal
  return (
    <div className={`drawer-root ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen}>
      <div className="scrim" onClick={() => setCartOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Cart" inert={!cartOpen}>
        <div className="drawer-head">
          <h2>Your cart</h2>
          <button ref={closeRef} className="text-btn" onClick={() => setCartOpen(false)}>Close</button>
        </div>
        {lines.length === 0 ? (
          <div className="empty">
            <p>Your cart is empty.</p>
            <Link className="btn" to="/shop" onClick={() => setCartOpen(false)}>Browse furniture</Link>
          </div>
        ) : (
          <>
            <p className="ship-note">
              {left > 0 ? `Add ${peso(left)} more for free delivery.` : 'This order qualifies for free delivery.'}
              <span className="meter"><span style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100)}%` }} /></span>
            </p>
            <ul className="lines">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id}>
                  <Photo src={p.image} alt="" w={160} h={160} />
                  <div className="line-info">
                    <Link to={`/product/${p.slug}`} onClick={() => setCartOpen(false)}>{p.name}</Link>
                    <span className="muted">{peso(p.price)} each</span>
                    <div className="line-row">
                      <Qty value={qty} max={p.stock} onChange={(n) => setQty(p.id, n)} label={p.name} />
                      <button className="text-btn" onClick={() => remove(p.id)}>Remove</button>
                    </div>
                  </div>
                  <strong>{peso(p.price * qty)}</strong>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <dl className="totals">
                <div><dt>Subtotal</dt><dd>{peso(subtotal)}</dd></div>
                <div><dt>Delivery</dt><dd>{shipping ? peso(shipping) : 'Free'}</dd></div>
                <div className="grand"><dt>Total</dt><dd>{peso(total)}</dd></div>
              </dl>
              <button className="btn block" onClick={() => { setCartOpen(false); nav('/checkout') }}>Go to checkout</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
