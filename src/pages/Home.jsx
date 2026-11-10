import { Link } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { CATEGORIES } from '../lib/supabase'
import ProductCard from '../components/ProductCard.jsx'
import Photo from '../components/Photo.jsx'
import Weave from '../components/Weave.jsx'
import Status from '../components/Status.jsx'

const HERO = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'
const WORKSHOP = 'https://images.unsplash.com/photo-1628152371231-936cf45eb8f3'

const MATERIALS = [
  { name: 'Narra', text: 'A dense Philippine hardwood with a red-gold grain. We use plantation-grown boards for tables, beds and cabinets, joined without screws where the joint allows.' },
  { name: 'Rattan', text: 'A climbing palm that bends under steam and holds its shape when dry. Our weavers in Cebu split it by hand for seats, shades and cabinet fronts.' },
  { name: 'Abaca', text: 'A banana-family fiber, stronger than hemp. It becomes rope, cord and the woven panels on our baskets and lamps.' },
]

export default function Home() {
  const { products, loading, loadError } = useStore()
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const sale = products.filter((p) => p.compare_at).slice(0, 4)
  const cover = (c) => products.find((p) => p.category === c)

  return (
    <>
      <section className="hero">
        <div className="hero-weave"><Weave id="hero-weave" color="#dfe4d8" size={44} /></div>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>Furniture woven, joined and finished by hand.</h1>
            <p className="lede">Chairs, tables and cabinets in narra, rattan and abaca, built in small Philippine workshops and delivered to your door.</p>
            <div className="hero-cta">
              <Link className="btn" to="/shop">Shop all furniture</Link>
              <Link className="btn ghost" to="/shop?category=Seating">See seating</Link>
            </div>
          </div>
          <div className="hero-photo">
            <Photo src={HERO} alt="A yellow lounge chair with a wooden frame in a bright living room" w={760} h={900} eager />
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Shop by room and use</h2>
        </div>
        <ul className="cat-grid">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link to={`/shop?category=${c}`}>
                <Photo src={cover(c)?.image} alt="" w={360} h={360} />
                <span>{c}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Workshop favorites</h2>
          <Link to="/shop">View all furniture</Link>
        </div>
        <Status loading={loading} error={loadError} />
        <div className="grid">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="materials">
        <div className="wrap materials-grid">
          <div className="materials-photo">
            <Photo src={WORKSHOP} alt="A wooden sideboard with plants, vases and woven baskets" w={720} h={820} />
          </div>
          <div>
            <h2>Three materials, grown here</h2>
            <dl>
              {MATERIALS.map((m) => (
                <div key={m.name}>
                  <dt>{m.name}</dt>
                  <dd>{m.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {sale.length > 0 && (
        <section className="wrap section">
          <div className="section-head">
            <h2>Reduced this month</h2>
            <Link to="/shop?sale=1">View all reduced pieces</Link>
          </div>
          <div className="grid">{sale.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </>
  )
}
