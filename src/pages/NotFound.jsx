import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="wrap section narrow center">
      <h1>This page does not exist</h1>
      <p className="lede">The link may be old, or the piece may have been retired.</p>
      <Link className="btn" to="/shop">Browse furniture</Link>
    </div>
  )
}
