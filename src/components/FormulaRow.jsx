/**
 * Renders a single row of formula tokens.
 * children = any mix of EditableInput, DisabledBox, <span className="op">, etc.
 */
export default function FormulaRow({ children }) {
  return (
    <div className="formula-row">
      {children}
    </div>
  )
}
