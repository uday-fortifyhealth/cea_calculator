export default function MetricCard({ value, label }) {
  const isNA = value === null || value === undefined || value === 'N/A'

  return (
    <div className="metric-card">
      <div className={`metric-value ${isNA ? 'na' : ''}`}>
        {isNA ? 'N/A' : value}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  )
}
