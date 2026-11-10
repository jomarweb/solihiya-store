export default function Qty({ value, onChange, max = 99, label }) {
  return (
    <div className="qty" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Decrease quantity">−</button>
      <output>{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">+</button>
    </div>
  )
}
