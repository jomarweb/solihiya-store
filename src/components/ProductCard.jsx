import { Link } from 'react-router-dom'
import { peso } from '../lib/supabase'
import { useStore } from '../lib/store.jsx'
import Photo from './Photo.jsx'

export default function ProductCard({ p }) {
  const { add } = useStore()
  const out = p.stock <= 0
  return (
    <article className="card">
      <Link to={`/product/${p.slug}`} className="card-media">
        <Photo src={p.image} alt={p.name} w={520} h={620} />
        {p.compare_at && <span className="tag sale">Save {peso(p.compare_at - p.price)}</span>}
        {out && <span className="tag out">Sold out</span>}
      </Link>
      <div className="card-body">
        <div>
          <h3><Link to={`/product/${p.slug}`}>{p.name}</Link></h3>
          <p className="muted">{p.material}</p>
        </div>
        <p className="price">
          {peso(p.price)}
          {p.compare_at && <s>{peso(p.compare_at)}</s>}
        </p>
      </div>
      <button className="btn ghost small" disabled={out} onClick={() => add(p.id)}>
        {out ? 'Sold out' : 'Add to cart'}
      </button>
    </article>
  )
}
