export default function EditableInput({ value, onChange, label, suffix = '', prefix = '' }) {
  return (
    <div className="labeled-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {prefix && <span className="op">{prefix}</span>}
        <input
          className="editable-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ minWidth: `${Math.max(52, String(value).length * 8 + 20)}px` }}
        />
        {suffix && <span className="op">{suffix}</span>}
      </div>
      {label && <span className="box-label">{label}</span>}
    </div>
  )
}
