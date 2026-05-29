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
  grantSize:            '10189220',
  costPerPersonYear:    '0.165',
  yldsper100k:          '812',
  trialEffect:          '22.00%',
  internalValidity:     '-15.00%',
  externalValidity:     '12.73%',
  valuePerYLD:          '2.300',
  pctUnder15:           '27.05%',
  anemiaPrev:           '34.30%',
  incomeIncrease:       '0.37%',
  discount:             '4.00%',
  years:                '40',
  sharingMult:          '2.000',
  wlInfO:               '1.443',
  deathsPerBeneficiary: '0.000032',
  valuePerDeath:        '84',
  uovPerBeneficiary:    '0.0014',
  supplAdj:             '-16.50%',
}

export default function IronFortification() {
  const [p, setP] = useState(DEFAULT_PARAMS)

  const set = (key) => (val) => setP((prev) => ({ ...prev, [key]: val }))

  // Recompute entire pipeline whenever any input changes
  const c = useMemo(() => computeAll(p), [p])

  // Metric card helpers
  const peopleReached      = formatValue(c.personYears, 0)
  const deathsAvertedLabel = c.deathsAverted > 0 ? Math.round(c.deathsAverted).toString() : null
  const costPerDeath       = c.costPerDeathAverted != null ? formatCurrency(c.costPerDeathAverted) : null

  return (
    <div>
      <div className="tab-content-header">
        <div className="tab-content-title">
          Iron Fortification (India) <span className="multiple">{formatMultiple(c.ceMultiple)}</span>
        </div>
        <button className="tab-close-btn">×</button>
      </div>

      {/* Summary metrics */}
      <div className="metrics-row">
        <MetricCard value={costPerDeath}       label="Cost per death averted" />
        <MetricCard value={deathsAvertedLabel} label="Deaths averted" />
        <MetricCard value={peopleReached}      label="People reached" />
      </div>

      {/* Introduction card */}
      <div className="intro-card">
        <div className="intro-card-title">About this Cost-Effectiveness Analysis</div>
        <p>
          This page shows how GiveWell estimates the impact of every dollar donated to Fortify
          Health's iron fortification program in India — and how it compares to simply giving that
          money as cash to people in poverty.
        </p>
        <p>
          To compare different health outcomes, GiveWell assigns numerical values to each outcome.
          For example, averting one neonatal death is valued at 84 units, while one year lived with
          anemia-related disability is valued at 2.3 units. These values are drawn from donor
          surveys, studies of low-income communities, and standard public health measures. GiveWell
          publishes these assumptions openly so they can be reviewed and scrutinised.
        </p>
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
          <DisabledBox value={formatValue(c.personYears, 2)} />
        </FormulaRow>
        <p className="section-explanation">
          GiveWell estimates Fortify Health will use its $10.2M grant to reach 61.7 million
          person-years of coverage — meaning the equivalent of 61.7 million people receiving
          fortified flour for one year. This works out to just $0.165 per person per year (roughly
          ₹1 per month), after accounting for expected wastage in the supply chain and a
          conservative adjustment for over-optimistic production projections.
        </p>
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
          <DisabledBox value={formatValue(c.anemiaMorbidityUov, 1)} label="UoV" />
        </FormulaRow>
        <p className="section-explanation">
          Iron deficiency causes anemia, which reduces quality of life. Among the 61.7 million
          people reached, GiveWell estimates anemia causes 812 years of healthy life lost per
          100,000 people annually. Iron fortification reduces anemia by about 22%, further adjusted
          for how well trial results translate to real-world programs (internal &amp; external
          validity). In total, this program is estimated to avert 243,100 units of value from
          anemia alone — the single largest benefit, contributing about 36% of the program's total
          impact.
        </p>
      </FormulaSection>

      {/* §3 — Development Benefits */}
      <FormulaSection number={3} title="Development Benefits">
        <FormulaRow>
          <EditableInput value={p.pctUnder15} onChange={set('pctUnder15')} label="% under 15" />
          <span className="op">×</span>
          <EditableInput value={p.anemiaPrev} onChange={set('anemiaPrev')} label="Anemia prev." />
          <span className="op">→</span>
          <DisabledBox value={formatValue(c.childhoodAnemiaYears, 1)} label="childhood anemia-years averted" />
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
          <DisabledBox value={formatValue(c.developmentUov, 1)} label="UoV" />
        </FormulaRow>
        <p className="section-explanation">
          Children who grow up anemic tend to earn less as adults. About 27% of people reached by
          this program are under 15 and about 34% of them are anaemic. GiveWell estimates that for
          every year of childhood anemia averted, future adult income increases by about ~0.4%.
          Accounting for the time it takes for children to reach earning age (discounted over 40
          years) and a household income multiplier, this pathway contributes 176,900 units of value
          — about 27% of total impact.
        </p>
      </FormulaSection>

      {/* §4 — Neonatal deaths averted */}
      <FormulaSection number={4} title="Neonatal deaths averted">
        <FormulaRow>
          <DisabledBox value={formatValue(c.personYears, 2)}  />
          <span className="op">×</span>
          <DisabledBox value={formatValue(c.deathsPerBeneficiaryRate, 3)} label="Deaths/beneficiary" />
          <span className="op">×</span>
          <EditableInput value={p.valuePerDeath} onChange={set('valuePerDeath')} label="Value/death" />
          <span className="op">→</span>
          <DisabledBox value={formatValue(c.neonatalUov, 1)} label="UoV" />
        </FormulaRow>
        <p className="section-explanation">
          Iron during pregnancy reduces the risk of neonatal death. The model estimates about 3.2
          neonatal deaths are averted per 100,000 beneficiaries after conservative adjustments for
          the difference between iron supplements and fortification. This pathway contributes
          166,000 units of value — about 25% of total impact. GiveWell applies heavy discounts
          given that the evidence comes from iron supplementation studies, not fortification
          directly.
        </p>
      </FormulaSection>

      {/* §5 — Physical work capacity */}
      <FormulaSection number={5} title="Physical work capacity">
        <FormulaRow>
          <DisabledBox value={formatValue(c.personYears, 2)} />
          <span className="op">×</span>
          <EditableInput value={p.uovPerBeneficiary} onChange={set('uovPerBeneficiary')} label="UoV/beneficiary" />
          <span className="op">→</span>
          <DisabledBox value={formatValue(c.physicalUov, 1)} label="UoV" />
        </FormulaRow>
        <p className="section-explanation">
          Among working-age adults who are anaemic and do physically demanding jobs (about 5% of
          all beneficiaries), iron fortification increases average income per beneficiary by 0.04%.
          After adjusting for resource sharing and removing overlap with other benefit streams, this
          contributes 86,500 units of value — about 13% of total impact.
        </p>
      </FormulaSection>

      {/* §6 — Total value & CE multiple */}
      <FormulaSection number={6} title="Total value & CE multiple">
        <FormulaRow>
          <span className="op">(</span>
          <DisabledBox value={formatValue(c.subtotalUov, 1)} label="UoV" />
          <span className="op">) × (1+</span>
          <EditableInput value={p.supplAdj} onChange={set('supplAdj')} label="Suppl. adj." />
          <span className="op">) =</span>
          <DisabledBox value={formatValue(c.adjustedUov, 1)} label="UoV" />
        </FormulaRow>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {c.ceMultiple > 0 ? `${formatMultiple(c.ceMultiple)} cash transfers` : '— cash transfers'}
        </div>
        <p className="section-explanation">
          Adding up all four pathways gives a total of 672,500 units of value. After a final 16.5%
          downward adjustment (to account for a supplement-based program that fortification may
          partially substitute), the net value is 561,500 units. Compared to simply giving that
          money as cash to poor households, this program delivers 16.5× more benefit per dollar —
          making it one of GiveWell's most cost-effective grants.
        </p>
      </FormulaSection>
    </div>
  )
}
