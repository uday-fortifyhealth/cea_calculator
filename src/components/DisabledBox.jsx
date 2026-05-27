export default function DisabledBox({ value, label }) {
  const display = value === null || value === undefined ? '—' : value

  return (
    <div className="labeled-box">
      <div className="disabled-box">{display}</div>
      {label && <span className="box-label">{label}</span>}
    </div>
  )
}
