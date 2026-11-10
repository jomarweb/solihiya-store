// The solihiya cane weave: paired horizontals and verticals crossed by diagonals,
// leaving the small octagonal openings you see on a woven chair seat.
export default function Weave({ id = 'weave', color = 'currentColor', size = 28, className }) {
  const s = size, a = s * 0.36, b = s * 0.64
  return (
    <svg className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
          <g stroke={color} fill="none" strokeLinecap="square">
            <path d={`M0 ${a}H${s}M0 ${b}H${s}M${a} 0V${s}M${b} 0V${s}`} strokeWidth={s * 0.075} />
            <path d={`M0 ${s}L${s} 0M${-s / 2} ${s / 2}L${s / 2} ${-s / 2}M${s / 2} ${s * 1.5}L${s * 1.5} ${s / 2}M0 0L${s} ${s}M${-s / 2} ${s / 2}L${s / 2} ${s * 1.5}M${s / 2} ${-s / 2}L${s * 1.5} ${s / 2}`} strokeWidth={s * 0.05} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
