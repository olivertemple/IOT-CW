import React from 'react';
import { LayoutGrid, BarChart2, Settings, Package } from 'lucide-react';

interface DashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full" />
          </div>
          <h1 className="text-sm font-semibold text-white tracking-tight">SmartTap <span className="text-zinc-500 font-normal">Manager</span></h1>
        </div>
        
        <nav className="flex items-center bg-zinc-900/50 p-1 rounded-lg border border-white/5">
          <NavButton 
            label="Overview" 
            icon={<LayoutGrid className="w-3.5 h-3.5" />} 
            isActive={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <NavButton 
            label="Analytics" 
            icon={<BarChart2 className="w-3.5 h-3.5" />} 
            isActive={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
          <NavButton 
            label="Stock" 
            icon={<Package className="w-3.5 h-3.5" />} 
            isActive={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
          />
          <NavButton 
            label="Settings" 
            icon={<Settings className="w-3.5 h-3.5" />} 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
      </div>
    </header>
  );
};

const NavButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
      isActive 
      ? 'bg-zinc-800 text-white shadow-sm' 
      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
    }`}
  >
    {icon}
    {label}
  </button>
);