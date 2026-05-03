import React from 'react';
import { useStore } from '../store';
import { Layers, Settings2, Wrench, BotMessageSquare, Activity, Scan } from 'lucide-react';

const NAV = [
  { id: 'llm',           icon: BotMessageSquare, label: 'AI' },
  { id: 'vision',        icon: Scan,             label: 'Vision' },
  { id: 'simulation',    icon: Layers,           label: 'Sim' },
  { id: 'configuration', icon: Settings2,        label: 'Config' },
  { id: 'calibration',   icon: Wrench,           label: 'Setup' },
  { id: 'training',      icon: Activity,         label: 'Train' },
];

export default function BottomNav() {
  const { currentView, setCurrentView, setIsRightPanelOpen, setIsSidebarOpen } = useStore();

  const handleNav = (id) => {
    setCurrentView(id);
    setIsSidebarOpen(false);
    setIsRightPanelOpen(id !== 'simulation');
  };

  return (
    <div className="bottom-nav">
      {NAV.map(({ id, icon: Icon, label }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            className={`bottom-nav-btn ${active ? 'active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
