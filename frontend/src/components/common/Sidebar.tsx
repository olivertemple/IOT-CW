import React from 'react';
import { Beer, Settings, Activity, Sparkles, Package, BarChart3 } from 'lucide-react';
import NavIcon from './NavIcon';

interface SidebarProps {
  activeView: 'dashboard' | 'inventory' | 'analytics' | 'taps';
  isConnected: boolean;
  onViewChange: (view: 'dashboard' | 'inventory' | 'analytics' | 'taps') => void;
  onSettingsClick: () => void;
  connectedCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, isConnected, onViewChange, onSettingsClick, connectedCount }) => {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[min(1200px,92vw)] glass-panel rounded-[28px] px-8 py-4 z-50">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center shadow-lg">
            <Beer size={24} className="fill-black" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-ink/60">SmartBar OS</div>
            <div className="text-lg font-display text-ink">Control Suite</div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <NavIcon
            icon={<Activity size={18} />}
            label="Taps"
            active={activeView === 'taps'}
            onClick={() => onViewChange('taps')}
          />
          <NavIcon
            icon={<Sparkles size={18} />}
            label="Live"
            active={activeView === 'dashboard'}
            onClick={() => onViewChange('dashboard')}
          />
          <NavIcon
            icon={<Package size={18} />}
            label="Stock"
            active={activeView === 'inventory'}
            onClick={() => onViewChange('inventory')}
          />
          <NavIcon
            icon={<BarChart3 size={18} />}
            label="Usage"
            active={activeView === 'analytics'}
            onClick={() => onViewChange('analytics')}
          />
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone rounded-full text-sm font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-pine pulse-dot' : 'bg-ember'}`}></span>
            {isConnected ? 'Online' : 'Offline'}
          </div>
          {connectedCount > 0 && (
            <div className="px-4 py-2 bg-white border border-stone rounded-full text-sm font-semibold text-pine">
              {connectedCount} Tap{connectedCount === 1 ? '' : 's'} Connected
            </div>
          )}
          <button
            onClick={onSettingsClick}
            className="w-11 h-11 rounded-2xl bg-ink text-white hover:bg-night transition-all"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
