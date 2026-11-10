import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { CATEGORIES, peso } from '../lib/supabase'
import ProductCard from '../components/ProductCard.jsx'
import Status from '../components/Status.jsx'

const PRICES = [
  { id: 'a', label: `Under ${peso(10000)}`, test: (p) => p.price < 10000 },
  { id: 'b', label: `${peso(10000)} to ${peso(30000)}`, test: (p) => p.price >= 10000 && p.price <= 30000 },
  { id: 'c', label: `Over ${peso(30000)}`, test: (p) => p.price > 30000 },
]
const SORTS = {
  featured: ['Featured first', (a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id],
  low: ['Price, low to high', (a, b) => a.price - b.price],
  high: ['Price, high to low', (a, b) => b.price - a.price],
  name: ['Name, A to Z', (a, b) => a.name.localeCompare(b.name)],
}

export default function Shop() {
  const { products, loading, loadError } = useStore()
  const [sp, setSp] = useSearchParams()
  const category = sp.get('category') || ''
  const material = sp.get('material') || ''
  const price = sp.get('price') || ''
  const sort = sp.get('sort') || 'featured'
  const q = (sp.get('q') || '').toLowerCase()
  const sale = sp.get('sale') === '1'
  const inStock = sp.get('stock') === '1'

  const set = (k, v) => {
    const next = new URLSearchParams(sp)
    if (v) next.set(k, v); else next.delete(k)
    setSp(next, { replace: true })
  }
  const materials = useMemo(() => [...new Set(products.map((p) => p.material_group))].sort(), [products])

  const list = useMemo(() => {
    const pr = PRICES.find((x) => x.id === price)
    return products
      .filter((p) => !category || p.category === category)
      .filter((p) => !material || p.material_group === material)
      .filter((p) => !pr || pr.test(p))
      .filter((p) => !sale || p.compare_at)
      .filter((p) => !inStock || p.stock > 0)
      .filter((p) => !q || `${p.name} ${p.category} ${p.material} ${p.blurb}`.toLowerCase().includes(q))
      .sort((SORTS[sort] || SORTS.featured)[1])
  }, [products, category, material, price, sort, q, sale, inStock])

  const active = category || material || price || q || sale || inStock
  const title = q ? `Results for “${sp.get('q')}”` : category || (sale ? 'Reduced pieces' : 'All furniture')

  return (
    <div className="wrap shop">
      <div className="shop-head">
        <h1>{title}</h1>
        <p className="muted" role="status">{loading ? '' : `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`}</p>
      </div>
      <div className="shop-layout">
        <aside className="filters" aria-label="Filters">
          <fieldset>
            <legend>Category</legend>
            <label><input type="radio" name="cat" checked={!category} onChange={() => set('category', '')} /> All</label>
            {CATEGORIES.map((c) => (
              <label key={c}><input type="radio" name="cat" checked={category === c} onChange={() => set('category', c)} /> {c}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Material</legend>
            <label><input type="radio" name="mat" checked={!material} onChange={() => set('material', '')} /> Any</label>
            {materials.map((m) => (
              <label key={m}><input type="radio" name="mat" checked={material === m} onChange={() => set('material', m)} /> {m}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <label><input type="radio" name="price" checked={!price} onChange={() => set('price', '')} /> Any</label>
            {PRICES.map((x) => (
              <label key={x.id}><input type="radio" name="price" checked={price === x.id} onChange={() => set('price', x.id)} /> {x.label}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Availability</legend>
            <label><input type="checkbox" checked={inStock} onChange={(e) => set('stock', e.target.checked ? '1' : '')} /> In stock only</label>
            <label><input type="checkbox" checked={sale} onChange={(e) => set('sale', e.target.checked ? '1' : '')} /> Reduced only</label>
          </fieldset>
          {active && <button className="text-btn" onClick={() => setSp({}, { replace: true })}>Clear all filters</button>}
        </aside>
        <div>
          <div className="sort-row">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)}>
              {Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <Status loading={loading} error={loadError} />
          {!loading && !loadError && list.length === 0 && (
            <div className="empty">
              <p>No pieces match these filters.</p>
              <button className="btn ghost" onClick={() => setSp({}, { replace: true })}>Clear all filters</button>
            </div>
          )}
          <div className="grid three">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </div>
    </div>
  )
}
