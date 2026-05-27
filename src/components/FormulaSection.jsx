/**
 * A numbered card section that wraps one or more formula rows.
 * Props:
 *   number  – section index (1-6)
 *   title   – section heading string
 *   children – FormulaRow(s) or any content
 */
export default function FormulaSection({ number, title, children }) {
  return (
    <div className="formula-section">
      <div className="formula-section-header">
        <span className="formula-section-number">{number}</span>
        <span className="formula-section-title">{title}</span>
      </div>
      <div className="formula-section-body">
        {children}
      </div>
    </div>
  )
}
