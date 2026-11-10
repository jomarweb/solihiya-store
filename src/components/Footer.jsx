import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/supabase'
import Weave from './Weave.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-weave"><Weave id="footer-weave" color="#2c5142" size={34} /></div>
      <div className="wrap footer-grid">
        <div>
          <p className="footer-logo">Solihiya</p>
          <p className="muted-on-dark">Furniture in narra, rattan and abaca, built in small workshops in Pampanga, Cebu and Bohol.</p>
        </div>
        <div>
          <h2>Shop</h2>
          <ul>{CATEGORIES.map((c) => <li key={c}><Link to={`/shop?category=${c}`}>{c}</Link></li>)}</ul>
        </div>
        <div>
          <h2>Your orders</h2>
          <ul>
            <li><Link to="/account">Order history</Link></li>
            <li><Link to="/sign-in">Sign in or create an account</Link></li>
          </ul>
        </div>
        <div>
          <h2>Delivery</h2>
          <p className="muted-on-dark">Free delivery on orders of ₱50,000 or more. ₱1,500 flat rate below that, anywhere in the Philippines.</p>
        </div>
      </div>
      <p className="wrap legal">This is a demonstration store. Product photos are from Unsplash.</p>
    </footer>
  )
}
