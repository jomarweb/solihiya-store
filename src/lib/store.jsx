import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, configured, FREE_SHIPPING_FROM, SHIPPING_FEE } from './supabase'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

const readCart = () => {
  try { return JSON.parse(localStorage.getItem('solihiya-cart')) || [] } catch { return [] }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [cart, setCart] = useState(readCart) // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false)

  const loadProducts = useCallback(async () => {
    if (!configured) { setLoadError('The store is not connected to its database yet.'); setLoading(false); return }
    const { data, error } = await supabase.from('products').select('*').order('id')
    if (error) setLoadError('The catalog could not be loaded. Refresh the page to try again.')
    else { setProducts(data); setLoadError('') }
    setLoading(false)
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    if (!configured) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    try { localStorage.setItem('solihiya-cart', JSON.stringify(cart)) } catch { /* storage unavailable */ }
  }, [cart])

  const add = (id, qty = 1) => {
    setCart((c) => {
      const p = products.find((x) => x.id === id)
      const max = p ? p.stock : 99
      const found = c.find((l) => l.id === id)
      if (found) return c.map((l) => (l.id === id ? { ...l, qty: Math.min(max, l.qty + qty) } : l))
      return [...c, { id, qty: Math.min(max, qty) }]
    })
    setCartOpen(true)
  }
  const setQty = (id, qty) =>
    setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l))))
  const remove = (id) => setCart((c) => c.filter((l) => l.id !== id))
  const clear = () => setCart([])

  const lines = useMemo(
    () => cart.map((l) => ({ ...l, product: products.find((p) => p.id === l.id) })).filter((l) => l.product),
    [cart, products],
  )
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

  const value = {
    products, loading, loadError, loadProducts, user, authReady,
    lines, count, subtotal, shipping, total: subtotal + shipping,
    add, setQty, remove, clear, cartOpen, setCartOpen,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
