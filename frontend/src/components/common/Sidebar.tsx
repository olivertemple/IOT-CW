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
    <header className="fixed top-0 left-0 right-0 w-full glass-panel border-b border-white/10 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 flex items-center justify-center shadow-lg">
              <Beer size={24} className="fill-current" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-semibold">SmartBar OS</div>
              <div className="text-xl font-display text-white font-bold">Tap Control</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavIcon
              icon={<Activity size={20} />}
              label="Taps"
              active={activeView === 'taps'}
              onClick={() => onViewChange('taps')}
            />
            <NavIcon
              icon={<Sparkles size={20} />}
              label="Live"
              active={activeView === 'dashboard'}
              onClick={() => onViewChange('dashboard')}
            />
            <NavIcon
              icon={<Package size={20} />}
              label="Stock"
              active={activeView === 'inventory'}
              onClick={() => onViewChange('inventory')}
            />
            <NavIcon
              icon={<BarChart3 size={20} />}
              label="Usage"
              active={activeView === 'analytics'}
              onClick={() => onViewChange('analytics')}
            />
          </nav>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border ${
              isConnected 
                ? 'bg-accent-green/20 border-accent-green/30 text-accent-green' 
                : 'bg-accent-red/20 border-accent-red/30 text-accent-red'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accent-green pulse-dot' : 'bg-accent-red'}`}></span>
              {isConnected ? 'Online' : 'Offline'}
            </div>
            {connectedCount > 0 && (
              <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-bold text-accent-gold">
                {connectedCount} Active
              </div>
            )}
            <button
              onClick={onSettingsClick}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center justify-center"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
