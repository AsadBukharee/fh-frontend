"use client"

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { name: "CRB Profile", icon: "📋" },
    { name: "DyCA Profile", icon: "📊" },
    { name: "Accountant Profile", icon: "👤" },
    { name: "Home Office Profile", icon: "🏠" },
  ]

  return (
    <div className="flex gap-6 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => onTabChange(tab.name)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.name
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className={activeTab === tab.name ? "text-orange-500" : "text-gray-400"}>{tab.icon}</span>
          {tab.name}
        </button>
      ))}
    </div>
  )
}
