'use client';

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="inline-flex gap-1 bg-white/70 backdrop-blur-sm border border-emerald-100/60 p-1 rounded-2xl shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === tab.key
              ? 'bg-white text-emerald-600 border border-emerald-200/60 shadow-sm'
              : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
