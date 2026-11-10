import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { CATEGORIES } from '../lib/supabase'

export default function Header() {
  const { count, setCartOpen, user } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const search = (e) => {
    e.preventDefault()
    nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }
  return (
    <header className="site-header">
      <p className="notice">Demo store. Orders are saved, but no payment is taken and nothing ships.</p>
      <div className="wrap bar">
        <Link to="/" className="logo" aria-label="Solihiya home">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#1E3A2F" />
            <g stroke="#E2B455" fill="none">
              <path d="M0 12h32M0 20h32M12 0v32M20 0v32" strokeWidth="2" />
              <path d="M-2 18 18 -2M14 34 34 14M-2 14 18 34M14 -2 34 18" strokeWidth="1.4" />
            </g>
          </svg>
          <span>Solihiya</span>
        </Link>
        <form className="search" role="search" onSubmit={search}>
          <label className="sr" htmlFor="site-search">Search furniture</label>
          <input id="site-search" type="search" placeholder="Search chairs, tables, lamps" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="actions">
          <Link to={user ? '/account' : '/sign-in'} className="text-btn">{user ? 'Account' : 'Sign in'}</Link>
          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${count} items`}>
            Cart <span className="pill">{count}</span>
          </button>
        </div>
      </div>
      <nav className="wrap cats" aria-label="Categories">
        <NavLink to="/shop" end>Shop all</NavLink>
        {CATEGORIES.map((c) => (
          <Link key={c} to={`/shop?category=${c}`}>{c}</Link>
        ))}
      </nav>
    </header>
  )
}
