import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { peso } from '../lib/supabase'
import Photo from '../components/Photo.jsx'
import Qty from '../components/Qty.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Status from '../components/Status.jsx'
import NotFound from './NotFound.jsx'

export default function Product() {
  const { slug } = useParams()
  const { products, loading, loadError, add } = useStore()
  const [qty, setQty] = useState(1)
  useEffect(() => { setQty(1) }, [slug])
  const p = products.find((x) => x.slug === slug)

  useEffect(() => { if (p) document.title = `${p.name} | Solihiya`; return () => { document.title = 'Solihiya | Furniture made in the Philippines' } }, [p])

  if (loading || loadError) return <div className="wrap section"><Status loading={loading} error={loadError} /></div>
  if (!p) return <NotFound />
  const out = p.stock <= 0
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)

  return (
    <div className="wrap product">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${p.category}`}>{p.category}</Link> / <span aria-current="page">{p.name}</span>
      </nav>
      <div className="product-grid">
        <div className="product-photo">
          <Photo src={p.image} alt={p.name} w={900} h={1000} eager />
        </div>
        <div className="product-info">
          <h1>{p.name}</h1>
          <p className="lede">{p.blurb}</p>
          <p className="price big">
            {peso(p.price)}
            {p.compare_at && <><s>{peso(p.compare_at)}</s><span className="tag sale inline">Save {peso(p.compare_at - p.price)}</span></>}
          </p>
          <p className={`stock ${out ? 'none' : p.stock <= 5 ? 'low' : ''}`}>
            {out ? 'Sold out. The next batch is on the bench.' : p.stock <= 5 ? `Only ${p.stock} left in this batch` : 'In stock, ships within 5 working days'}
          </p>
          <div className="buy">
            <Qty value={qty} max={Math.max(1, p.stock)} onChange={(n) => setQty(Math.max(1, n))} label={p.name} />
            <button className="btn" disabled={out} onClick={() => add(p.id, qty)}>{out ? 'Sold out' : 'Add to cart'}</button>
          </div>
          <p className="body">{p.description}</p>
          <dl className="specs">
            <div><dt>Material</dt><dd>{p.material}</dd></div>
            <div><dt>Dimensions</dt><dd>{p.dimensions}</dd></div>
            <div><dt>Care</dt><dd>{p.care}</dd></div>
            <div><dt>Delivery</dt><dd>Free on orders of {peso(50000)} or more, {peso(1500)} flat rate otherwise.</dd></div>
          </dl>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>More {p.category.toLowerCase()}</h2></div>
          <div className="grid">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  )
}
