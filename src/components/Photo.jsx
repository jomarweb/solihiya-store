import { useState } from 'react'
import { img } from '../lib/supabase'
import Weave from './Weave.jsx'

export default function Photo({ src, alt, w = 900, h, className = '', eager }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div className={`photo photo-fallback ${className}`} role="img" aria-label={alt}>
        <Weave id={`f-${w}`} color="#b9c2b3" />
      </div>
    )
  }
  return (
    <img
      className={`photo ${className}`}
      src={img(src, w, h)}
      srcSet={`${img(src, w, h)} 1x, ${img(src, w * 2, h ? h * 2 : undefined)} 2x`}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  )
}
