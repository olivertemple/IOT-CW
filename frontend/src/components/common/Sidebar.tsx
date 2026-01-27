import React from 'react';
import { Beer, Settings, Activity, Sparkles, Package, BarChart3 } from 'lucide-react';
import NavIcon from './NavIcon';

interface SidebarProps {
  activeView: 'dashboard' | 'inventory' | 'analytics' | 'taps';
  isConnected: boolean;
  onViewChange: (view: 'dashboard' | 'inventory' | 'analytics' | 'taps') => void;
  onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, isConnected, onViewChange, onSettingsClick }) => {
  return (
    <aside className="fixed left-6 top-6 bottom-6 w-24 glass-panel rounded-[28px] flex flex-col items-center py-6 z-40">
      <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center shadow-lg">
        <Beer size={26} />
      </div>
      <div className="text-[11px] mt-3 font-semibold tracking-[0.2em] text-ink/70">SMARTBAR</div>

      <nav className="mt-10 flex-1 flex flex-col gap-3">
        <NavIcon
          icon={<Activity size={22} />}
          label="Taps"
          active={activeView === 'taps'}
          onClick={() => onViewChange('taps')}
        />
        <NavIcon
          icon={<Sparkles size={22} />}
          label="Live"
          active={activeView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
        />
        <NavIcon
          icon={<Package size={22} />}
          label="Stock"
          active={activeView === 'inventory'}
          onClick={() => onViewChange('inventory')}
        />
        <NavIcon
          icon={<BarChart3 size={22} />}
          label="Usage"
          active={activeView === 'analytics'}
          onClick={() => onViewChange('analytics')}
        />
      </nav>

      <button
        onClick={onSettingsClick}
        className="w-12 h-12 rounded-2xl bg-white border border-stone text-ink/70 hover:text-ink hover:border-ink transition-all"
      >
        <Settings size={20} />
      </button>

      <div className="mt-5">
        <div className={`w-3.5 h-3.5 rounded-full ${isConnected ? 'bg-pine pulse-dot' : 'bg-ember'}`}></div>
      </div>
    </aside>
  );
};

export default Sidebar;
