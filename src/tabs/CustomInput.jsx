import { useState, useMemo } from 'react'
import MetricCard from '../components/MetricCard'
import FormulaSection from '../components/FormulaSection'
import FormulaRow from '../components/FormulaRow'
import EditableInput from '../components/EditableInput'
import DisabledBox from '../components/DisabledBox'
import {
  computeAll,
  formatValue,
  formatCurrency,
  formatMultiple,
} from '../calculations'

const DEFAULT_PARAMS = {
  grantSize:            '1.0M',
  costPerPersonYear:    '0.00',
  yldsper100k:          '0',
  trialEffect:          '0.00%',
  internalValidity:     '0.00%',
  externalValidity:     '0.00%',
  valuePerYLD:          '0.000',
  pctUnder15:           '0.00%',
  anemiaPrev:           '0.00%',
  incomeIncrease:       '0.00%',
  discount:             '4.00%',
  years:                '40',
  sharingMult:          '0.000',
  wlInfO:               '0.000',
  deathsPerBeneficiary: '0',
  valuePerDeath:        '0',
  uovPerBeneficiary:    '0.000',
  supplAdj:             '0.00%',
}

export default function CustomInput() {
  const [p, setP] = useState(DEFAULT_PARAMS)

  const set = (key) => (val) => setP((prev) => ({ ...prev, [key]: val }))

  // Recompute entire pipeline whenever any input changes
  const c = useMemo(() => computeAll(p), [p])

  // Metric card helpers
  const peopleReached      = c.personYears > 0 ? formatValue(c.personYears, 0) : '0'
  const deathsAvertedLabel = c.deathsAverted > 0 ? Math.round(c.deathsAverted).toString() : null
  const costPerDeath       = c.costPerDeathAverted != null ? formatCurrency(c.costPerDeathAverted) : null

  return (
    <div>
      <div className="tab-content-header">
        <div className="tab-content-title">Custom Input</div>
      </div>

      {/* Summary metrics */}
      <div className="metrics-row">
        <MetricCard value={costPerDeath}       label="Cost per death averted" />
        <MetricCard value={deathsAvertedLabel} label="Deaths averted" />
        <MetricCard value={peopleReached}      label="People reached" />
      </div>

      <div className="section-how">
        <h6>How it's calculated</h6>
        <p>Supports large-scale iron fortification and supplementation programs to reduce anemia</p>
        <span className="section-hint">Click any highlighted value to edit it.</span>
      </div>

      {/* §1 — Person-years of coverage */}
      <FormulaSection number={1} title="Person-years of coverage">
        <FormulaRow>
          <EditableInput value={p.grantSize}        onChange={set('grantSize')}        label="Grant size (est. at top)" prefix="$" />
          <span className="op">÷</span>
          <EditableInput value={p.costPerPersonYear} onChange={set('costPerPersonYear')} label="Cost/person-year" prefix="$" />
          <span className="op">=</span>
          <DisabledBox value={c.personYears > 0 ? formatValue(c.personYears, 2) : '—'} />
        </FormulaRow>
      </FormulaSection>

      {/* §2 — Anemia morbidity averted */}
      <FormulaSection number={2} title="Anemia morbidity averted">
        <FormulaRow>
          <EditableInput value={p.yldsper100k}      onChange={set('yldsper100k')}      label="YLDs/100K" />
          <span className="op">×</span>
          <EditableInput value={p.trialEffect}      onChange={set('trialEffect')}      label="Trial effect" />
          <span className="op">× (1+</span>
          <EditableInput value={p.internalValidity} onChange={set('internalValidity')} label="Internal validity" />
          <span className="op">) × (1+</span>
          <EditableInput value={p.externalValidity} onChange={set('externalValidity')} label="External validity" />
          <span className="op">) ×</span>
          <EditableInput value={p.valuePerYLD}      onChange={set('valuePerYLD')}      label="Value/YLD" />
          <span className="op">→</span>
          <DisabledBox value={c.anemiaMorbidityUov > 0 ? formatValue(c.anemiaMorbidityUov, 1) : '—'} label="UoV" />
        </FormulaRow>
      </FormulaSection>

      {/* §3 — Development effects */}
      <FormulaSection number={3} title="Development effects">
        <FormulaRow>
          <EditableInput value={p.pctUnder15} onChange={set('pctUnder15')} label="% under 15" />
          <span className="op">×</span>
          <EditableInput value={p.anemiaPrev} onChange={set('anemiaPrev')} label="Anemia prev." />
          <span className="op">→</span>
          <DisabledBox
            value={c.childhoodAnemiaYears > 0 ? formatValue(c.childhoodAnemiaYears, 1) : '—'}
            label="childhood anemia-years averted"
          />
        </FormulaRow>
        <FormulaRow>
          <span className="op">PV(</span>
          <EditableInput value={p.incomeIncrease} onChange={set('incomeIncrease')} label="Income increase" />
          <span className="op">,</span>
          <EditableInput value={p.discount}       onChange={set('discount')}       label="Discount" />
          <span className="op">,</span>
          <EditableInput value={p.years}           onChange={set('years')}           label="Years" suffix=" yr" />
          <span className="op">) ×</span>
          <EditableInput value={p.sharingMult}     onChange={set('sharingMult')}     label="Sharing mult." />
          <span className="op">×</span>
          <EditableInput value={p.wlInfO}          onChange={set('wlInfO')}          label="WI Info" />
          <span className="op">→</span>
          <DisabledBox value={c.developmentUov > 0 ? formatValue(c.developmentUov, 1) : '—'} label="UoV" />
        </FormulaRow>
      </FormulaSection>

      {/* §4 — Neonatal deaths averted */}
      <FormulaSection number={4} title="Neonatal deaths averted">
        <FormulaRow>
          <DisabledBox value={c.personYears > 0 ? formatValue(c.personYears, 2) : '—'} label="Deaths/beneficiary" />
          <span className="op">×</span>
          <DisabledBox value={formatValue(c.deathsPerBeneficiaryRate, 3)} />
          <span className="op">×</span>
          <EditableInput value={p.valuePerDeath} onChange={set('valuePerDeath')} label="Value/death" />
          <span className="op">→</span>
          <DisabledBox value={c.neonatalUov > 0 ? formatValue(c.neonatalUov, 1) : '—'} label="UoV" />
        </FormulaRow>
      </FormulaSection>

      {/* §5 — Physical work capacity */}
      <FormulaSection number={5} title="Physical work capacity">
        <FormulaRow>
          <DisabledBox value={c.personYears > 0 ? formatValue(c.personYears, 2) : '—'} />
          <span className="op">×</span>
          <EditableInput value={p.uovPerBeneficiary} onChange={set('uovPerBeneficiary')} label="UoV/beneficiary" />
          <span className="op">→</span>
          <DisabledBox value={c.physicalUov > 0 ? formatValue(c.physicalUov, 1) : '—'} label="UoV" />
        </FormulaRow>
      </FormulaSection>

      {/* §6 — Total value & CE multiple */}
      <FormulaSection number={6} title="Total value & CE multiple">
        <FormulaRow>
          <span className="op">(</span>
          <DisabledBox value={c.subtotalUov > 0 ? formatValue(c.subtotalUov, 1) : '—'} label="UoV" />
          <span className="op">) × (1+</span>
          <EditableInput value={p.supplAdj} onChange={set('supplAdj')} label="Suppl. adj." />
          <span className="op">) =</span>
          <DisabledBox value={c.adjustedUov > 0 ? formatValue(c.adjustedUov, 1) : '—'} label="UoV" />
        </FormulaRow>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {c.ceMultiple > 0 ? `${formatMultiple(c.ceMultiple)} cash transfers` : '— cash transfers'}
        </div>
      </FormulaSection>
    </div>
  )
}
