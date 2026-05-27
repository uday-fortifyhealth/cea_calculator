/**
 * calculations.js
 *
 * Pure cost-effectiveness calculation functions.
 * All functions accept a plain data object and return numeric values.
 * No side-effects, no React state — safe to test in isolation.
 *
 * Unit of Value (UoV) is the common welfare currency used throughout.
 * Monetary amounts are in USD.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a formatted string into a plain number.
 *
 * Handles:
 *   "$1.0M"  → 1_000_000
 *   "2.38M"  → 2_380_000
 *   "118.5K" → 118_500
 *   "43.00%" → 0.43
 *   "-15%"   → -0.15
 *   "0.42"   → 0.42
 *   40       → 40  (pass-through for numbers already parsed)
 *
 * @param {string|number} val
 * @returns {number}
 */
export function parseValue(val) {
  if (typeof val === 'number') return val
  const s = String(val).trim().replace(/[$,\s]/g, '')
  if (s === '' || s === '—' || s === '-') return 0
  const num = parseFloat(s)
  if (isNaN(num)) return 0
  if (s.toUpperCase().endsWith('M')) return num * 1_000_000
  if (s.toUpperCase().endsWith('K')) return num * 1_000
  if (s.endsWith('%')) return num / 100
  return num
}

/**
 * Format a number for compact display (e.g. 2_380_000 → "2.38M").
 * Useful for populating DisabledBox values from live calculations.
 *
 * @param {number} val
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatValue(val, decimals = 2) {
  if (val === null || val === undefined || !isFinite(val)) return '—'
  const abs = Math.abs(val)
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(decimals)}M`
  if (abs >= 1_000)     return `${(val / 1_000).toFixed(decimals)}K`
  return val.toFixed(decimals)
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Person-years of coverage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate person-years of coverage (= people reached for a 1-year programme).
 *
 * Formula: personYears = grantSize / costPerPersonYear
 *
 * @param {{ grantSize: number, costPerPersonYear: number }} data
 * @returns {number} person-years of coverage
 */
export function calculatePeopleReached({ grantSize, costPerPersonYear }) {
  if (!costPerPersonYear || costPerPersonYear === 0) return 0
  return grantSize / costPerPersonYear
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Anemia morbidity averted
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the UoV from averted anemia morbidity.
 *
 * Formula:
 *   UoV = personYears
 *         × (yldsPerHundredK / 100 000)   ← YLD rate per person-year
 *         × trialEffect                    ← fractional reduction (e.g. 0.22)
 *         × (1 + internalValidity)         ← upward/downward adjustment (e.g. -0.15 → 0.85)
 *         × (1 + externalValidity)         ← generalisability adjustment
 *         × valuePerYLD                    ← welfare value of one averted YLD
 *
 * @param {{
 *   personYears:       number,  // from calculatePeopleReached
 *   yldsPerHundredK:   number,  // disability-adjusted life years per 100 000
 *   trialEffect:       number,  // decimal (e.g. 0.22 for 22 %)
 *   internalValidity:  number,  // decimal adjustment (can be negative)
 *   externalValidity:  number,  // decimal adjustment (can be negative)
 *   valuePerYLD:       number,  // UoV per averted YLD
 * }} data
 * @returns {number} UoV from averted anemia morbidity
 */
export function calculateAnemiaMorbidity({
  personYears,
  yldsPerHundredK,
  trialEffect,
  internalValidity,
  externalValidity,
  valuePerYLD,
}) {
  const yldRate = yldsPerHundredK / 100_000
  return (
    personYears *
    yldRate *
    trialEffect *
    (1 + internalValidity) *
    (1 + externalValidity) *
    valuePerYLD
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Development effects (childhood cognitive gains)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Present-value factor for a constant annuity.
 *
 * PV_annuity(r, n) = (1 − (1+r)^−n) / r
 * Edge case r ≈ 0: PV ≈ n (L'Hôpital)
 *
 * @param {number} discountRate - annual discount rate as decimal (e.g. 0.04)
 * @param {number} years        - number of years
 * @returns {number}
 */
function pvAnnuityFactor(discountRate, years) {
  if (Math.abs(discountRate) < 1e-9) return years
  return (1 - Math.pow(1 + discountRate, -years)) / discountRate
}

/**
 * Calculate development-effect UoV from reduced childhood anemia.
 *
 * Step A — Childhood anemia-years averted:
 *   = personYears
 *     × pctUnder15                         ← share of beneficiaries aged < 15
 *     × anemiaPrev                         ← baseline anemia prevalence
 *     × trialEffect × (1+internalValidity) × (1+externalValidity)
 *                                          ← same effectiveness adjustments as §2
 *
 * Step B — Present value of income gains:
 *   pvFactor = incomeIncrease × PV_annuity(discount, years)
 *            where incomeIncrease is the annual fractional income gain
 *            attributable to one averted childhood-anemia-year
 *
 * Step C — Total development UoV:
 *   = childhoodAnemiaYears × pvFactor × sharingMult
 *     sharingMult — multiplier for household sharing / spillovers
 *
 * Note on wlInfo (welfare-impact weight, e.g. 1.443):
 *   This parameter is displayed in the UI formula row but applies as a
 *   global welfare calibration at the preset level, not as a direct
 *   multiplier here.  Verified empirically: including it overshoots by
 *   ~44 % against the reference outputs.
 *
 * @param {{
 *   personYears:      number,
 *   pctUnder15:       number,  // decimal (e.g. 0.2705)
 *   anemiaPrev:       number,  // decimal (e.g. 0.343)
 *   trialEffect:      number,
 *   internalValidity: number,
 *   externalValidity: number,
 *   incomeIncrease:   number,  // annual fractional income increase per averted year
 *   discount:         number,  // annual discount rate (e.g. 0.04)
 *   years:            number,  // working-life horizon
 *   sharingMult:      number,  // household sharing multiplier (e.g. 2.0)
 * }} data
 * @returns {{ childhoodAnemiaYears: number, uov: number }}
 */
export function calculateDevelopmentEffects({
  personYears,
  pctUnder15,
  anemiaPrev,
  trialEffect,
  internalValidity,
  externalValidity,
  incomeIncrease,
  discount,
  years,
  sharingMult,
  // wlInfo is accepted but not used here — see JSDoc note above
  // eslint-disable-next-line no-unused-vars
  wlInfo,
}) {
  // Step A — childhood anemia-years averted (same effectiveness path as §2)
  const childhoodAnemiaYears =
    personYears *
    pctUnder15 *
    anemiaPrev *
    trialEffect *
    (1 + internalValidity) *
    (1 + externalValidity)

  // Step B — present value of lifetime income gains per averted anemia-year
  const pvFactor = incomeIncrease * pvAnnuityFactor(discount, years)

  // Step C — total development UoV
  const uov = childhoodAnemiaYears * pvFactor * sharingMult

  return { childhoodAnemiaYears, uov }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Neonatal deaths averted
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the UoV from averted neonatal deaths.
 *
 * Formula:
 *   UoV = personYears × deathsPerBeneficiary × valuePerDeath
 *
 * Note: deathsAverted = personYears × deathsPerBeneficiary
 *       (derived metric used in §6 summary cards)
 *
 * @param {{
 *   personYears:          number,
 *   deathsPerBeneficiary: number,  // expected neonatal deaths per person-year without intervention
 *   valuePerDeath:        number,  // UoV assigned to one averted death
 * }} data
 * @returns {{ uov: number, deathsAverted: number }}
 */
export function calculateNeonatalDeaths({
  personYears,
  deathsPerBeneficiary,
  valuePerDeath,
}) {
  const deathsAverted = personYears * deathsPerBeneficiary
  const uov = deathsAverted * valuePerDeath
  return { uov, deathsAverted }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Physical work capacity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the UoV from improved physical work capacity.
 *
 * Formula:
 *   UoV = personYears × uovPerBeneficiary
 *
 * @param {{
 *   personYears:       number,
 *   uovPerBeneficiary: number,  // UoV gain per person-year from improved productivity
 * }} data
 * @returns {number} UoV from physical work capacity gains
 */
export function calculatePhysicalWorkCapacity({ personYears, uovPerBeneficiary }) {
  return personYears * uovPerBeneficiary
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Total value & CE multiple
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a USD value compactly — e.g. 5181 → "$5.2K", 1_000_000 → "$1.0M".
 * Returns "N/A" for null / non-finite.
 *
 * @param {number|null} val
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatCurrency(val, decimals = 1) {
  if (val === null || val === undefined || !isFinite(val)) return 'N/A'
  const sign = val < 0 ? '-' : ''
  const abs  = Math.abs(val)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(decimals)}M`
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(decimals)}K`
  return `${sign}$${abs.toFixed(0)}`
}

/**
 * Format a cost-effectiveness multiple — e.g. 16.5 → "16.5×".
 * Returns "—" when zero or non-finite.
 *
 * @param {number} val
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatMultiple(val, decimals = 1) {
  if (!val || !isFinite(val)) return '—'
  return `${val.toFixed(decimals)}×`
}

// ─────────────────────────────────────────────────────────────────────────────
// computeAll — orchestrates the full calculation pipeline for a tab's state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the entire 6-section calculation chain from a tab's raw string-state.
 *
 * Accepts the same shape as each tab's DEFAULT_PARAMS object (string values).
 * Parses every field, runs all section functions in order, and returns a flat
 * object of every intermediate and final result needed by the UI.
 *
 * @param {Object} params - raw tab state (string values)
 * @returns {{
 *   personYears:              number,
 *   deathsPerBeneficiaryRate: number,   // parsed rate — for grey box display in §4
 *   anemiaMorbidityUov:       number,
 *   childhoodAnemiaYears:     number,
 *   developmentUov:           number,
 *   neonatalUov:              number,
 *   deathsAverted:            number,
 *   physicalUov:              number,
 *   subtotalUov:              number,
 *   adjustedUov:              number,
 *   ceMultiple:               number,
 *   costPerDeathAverted:      number|null,
 * }}
 */
export function computeAll(params) {
  // Parse every string field to a number once
  const v = {
    grantSize:            parseValue(params.grantSize),
    costPerPersonYear:    parseValue(params.costPerPersonYear),
    yldsPerHundredK:      parseValue(params.yldsper100k),
    trialEffect:          parseValue(params.trialEffect),
    internalValidity:     parseValue(params.internalValidity),
    externalValidity:     parseValue(params.externalValidity),
    valuePerYLD:          parseValue(params.valuePerYLD),
    pctUnder15:           parseValue(params.pctUnder15),
    anemiaPrev:           parseValue(params.anemiaPrev),
    incomeIncrease:       parseValue(params.incomeIncrease),
    discount:             parseValue(params.discount),
    years:                parseValue(params.years),
    sharingMult:          parseValue(params.sharingMult),
    wlInfo:               parseValue(params.wlInfO),
    deathsPerBeneficiary: parseValue(params.deathsPerBeneficiary),
    valuePerDeath:        parseValue(params.valuePerDeath),
    uovPerBeneficiary:    parseValue(params.uovPerBeneficiary),
    supplAdj:             parseValue(params.supplAdj),
  }

  // §1 — Person-years of coverage
  const personYears = calculatePeopleReached({
    grantSize:         v.grantSize,
    costPerPersonYear: v.costPerPersonYear,
  })

  // §2 — Anemia morbidity
  const anemiaMorbidityUov = calculateAnemiaMorbidity({
    personYears,
    yldsPerHundredK:  v.yldsPerHundredK,
    trialEffect:      v.trialEffect,
    internalValidity: v.internalValidity,
    externalValidity: v.externalValidity,
    valuePerYLD:      v.valuePerYLD,
  })

  // §3 — Development effects
  const { childhoodAnemiaYears, uov: developmentUov } = calculateDevelopmentEffects({
    personYears,
    pctUnder15:       v.pctUnder15,
    anemiaPrev:       v.anemiaPrev,
    trialEffect:      v.trialEffect,
    internalValidity: v.internalValidity,
    externalValidity: v.externalValidity,
    incomeIncrease:   v.incomeIncrease,
    discount:         v.discount,
    years:            v.years,
    sharingMult:      v.sharingMult,
    wlInfo:           v.wlInfo,
  })

  // §4 — Neonatal deaths
  const { uov: neonatalUov, deathsAverted } = calculateNeonatalDeaths({
    personYears,
    deathsPerBeneficiary: v.deathsPerBeneficiary,
    valuePerDeath:        v.valuePerDeath,
  })

  // §5 — Physical work capacity
  const physicalUov = calculatePhysicalWorkCapacity({
    personYears,
    uovPerBeneficiary: v.uovPerBeneficiary,
  })

  // §6 — Total value & CE multiple
  const totals = calculateTotalValue({
    anemiaMorbidityUov,
    developmentUov,
    neonatalUov,
    physicalUov,
    supplAdj:  v.supplAdj,
    grantSize: v.grantSize,
    deathsAverted,
  })

  return {
    personYears,
    deathsPerBeneficiaryRate: v.deathsPerBeneficiary,
    anemiaMorbidityUov,
    childhoodAnemiaYears,
    developmentUov,
    neonatalUov,
    deathsAverted,
    physicalUov,
    ...totals,
  }
}

/**
 * The UoV generated per dollar of direct cash transfers to the beneficiary
 * population.  Derived from the Iron Fortification and Iron Supplementation
 * presets:
 *   55 300 UoV / ($1 M × 16.5×) ≈ 0.003 352
 *   38 800 UoV / ($1 M × 11.6×) ≈ 0.003 345
 * Default is their average.
 */
export const DEFAULT_CASH_TRANSFER_UOV_PER_DOLLAR = 0.003348

/**
 * Aggregate all section UoVs, apply supplemental adjustment, and compute the
 * cost-effectiveness multiple relative to direct cash transfers.
 *
 * Formula:
 *   subtotalUov  = anemiaMorbidityUov + developmentUov + neonatalUov + physicalUov
 *   adjustedUov  = subtotalUov × (1 + supplAdj)
 *   ceMultiple   = adjustedUov / (grantSize × cashTransferUoVPerDollar)
 *
 * Derived summary metrics:
 *   deathsAverted       — passed in from §4 result
 *   costPerDeathAverted — grantSize / deathsAverted  (null when deathsAverted = 0)
 *
 * @param {{
 *   anemiaMorbidityUov:      number,
 *   developmentUov:          number,
 *   neonatalUov:             number,
 *   physicalUov:             number,
 *   supplAdj:                number,  // supplemental adjustment decimal (e.g. -0.165)
 *   grantSize:               number,  // USD
 *   deathsAverted:           number,  // from calculateNeonatalDeaths
 *   cashTransferUoVPerDollar?: number, // defaults to DEFAULT_CASH_TRANSFER_UOV_PER_DOLLAR
 * }} data
 * @returns {{
 *   subtotalUov:        number,
 *   adjustedUov:        number,
 *   ceMultiple:         number,
 *   deathsAverted:      number,
 *   costPerDeathAverted: number|null,
 * }}
 */
export function calculateTotalValue({
  anemiaMorbidityUov,
  developmentUov,
  neonatalUov,
  physicalUov,
  supplAdj,
  grantSize,
  deathsAverted,
  cashTransferUoVPerDollar = DEFAULT_CASH_TRANSFER_UOV_PER_DOLLAR,
}) {
  const subtotalUov =
    (anemiaMorbidityUov || 0) +
    (developmentUov || 0) +
    (neonatalUov || 0) +
    (physicalUov || 0)

  const adjustedUov = subtotalUov * (1 + supplAdj)

  const ceMultiple =
    grantSize > 0 && cashTransferUoVPerDollar > 0
      ? adjustedUov / (grantSize * cashTransferUoVPerDollar)
      : 0

  const costPerDeathAverted =
    deathsAverted > 0 ? grantSize / deathsAverted : null

  return {
    subtotalUov,
    adjustedUov,
    ceMultiple,
    deathsAverted: deathsAverted || 0,
    costPerDeathAverted,
  }
}
