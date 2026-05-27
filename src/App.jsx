import { useState } from 'react'
import TabNav from './components/TabNav'
import CustomInput from './tabs/CustomInput'
import IronSupplementation from './tabs/IronSupplementation'
import IronFortification from './tabs/IronFortification'

const TABS = [
  { id: 'custom',        label: 'Custom Input',                  multiple: null  },
  { id: 'supplementation', label: 'Iron Supplementation (India)', multiple: '11.6' },
  { id: 'fortification',   label: 'Iron Fortification (India)',   multiple: '16.5' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('custom')

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

      {/* Tab navigation */}
      <div className="px-4 pt-3">
        <TabNav tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Tab content */}
      <main className="px-4 py-3">
        {activeTab === 'custom'           && <CustomInput />}
        {activeTab === 'supplementation'  && <IronSupplementation />}
        {activeTab === 'fortification'    && <IronFortification />}
      </main>
    </div>
  )
}
