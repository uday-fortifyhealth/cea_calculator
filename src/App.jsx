import { useState } from 'react'
import TabNav from './components/TabNav'
import CustomInput from './tabs/CustomInput'           // TEMPORARILY HIDDEN — keep import intact
import IronSupplementation from './tabs/IronSupplementation' // TEMPORARILY HIDDEN — keep import intact
import IronFortification from './tabs/IronFortification'

// ─── TEMPORARILY HIDDEN TABS ────────────────────────────────────────────────
// The tabs below are hidden from the navigation UI on request.
// To restore them, uncomment each entry in VISIBLE_TABS and re-add their
// content renderers in the <main> block below.
//
// { id: 'custom',          label: 'Custom Input',                  multiple: null  },
// { id: 'supplementation', label: 'Iron Supplementation (India)', multiple: '11.6' },
// ────────────────────────────────────────────────────────────────────────────

const VISIBLE_TABS = [
  { id: 'fortification', label: 'Iron Fortification (India)', multiple: '16.5' },
]

export default function App() {
  // Default to the only visible tab
  const [activeTab, setActiveTab] = useState('fortification')

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header d-flex align-items-center gap-3 px-4 py-3">
        <div className="brand-badge">FH</div>
        <span className="brand-name">Fortify Health</span>
        <span className="header-meta">Nov 2025</span>
        <span className="header-range">0× — 16×</span>
      </header>

      {/* Slider placeholder */}
      <div className="slider-bar px-4 py-2">
        <div className="slider-track">
          <div className="slider-fill" />
        </div>
        <div className="slider-labels d-flex justify-content-between">
          <span>0×</span>
          <span>200×</span>
        </div>
      </div>

      {/* Tab navigation — shows only VISIBLE_TABS */}
      <div className="px-4 pt-3">
        <TabNav tabs={VISIBLE_TABS} activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Tab content */}
      <main className="px-4 py-3">
        {/* TEMPORARILY HIDDEN: {activeTab === 'custom'          && <CustomInput />}          */}
        {/* TEMPORARILY HIDDEN: {activeTab === 'supplementation' && <IronSupplementation />}  */}
        {activeTab === 'fortification' && <IronFortification />}
      </main>
    </div>
  )
}
