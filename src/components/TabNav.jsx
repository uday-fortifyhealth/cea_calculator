export default function TabNav({ tabs, activeTab, onSelect }) {
  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
          {tab.multiple && (
            <span className="tab-multiple">{tab.multiple}×</span>
          )}
        </button>
      ))}
    </nav>
  )
}
