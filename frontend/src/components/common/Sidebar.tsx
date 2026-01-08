import React from 'react';
import { Beer, Settings } from 'lucide-react';
import NavIcon from './NavIcon';

interface SidebarProps {
  activeView: 'dashboard' | 'inventory' | 'analytics' | 'taps';
  isConnected: boolean;
  onViewChange: (view: 'dashboard' | 'inventory' | 'analytics' | 'taps') => void;
  onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, isConnected, onViewChange, onSettingsClick }) => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Beer size={24} className="text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        <NavIcon 
          icon={<Beer size={24} />} 
          label="Taps"
          active={activeView === 'taps'}
          onClick={() => onViewChange('taps')}
        />
        <NavIcon 
          icon={<Beer size={24} />} 
          label="Dashboard"
          active={activeView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
        />
        <NavIcon 
          icon={<Beer size={24} />} 
          label="Stock"
          active={activeView === 'inventory'}
          onClick={() => onViewChange('inventory')}
        />
        <NavIcon 
          icon={<Beer size={24} />} 
          label="Analytics"
          active={activeView === 'analytics'}
          onClick={() => onViewChange('analytics')}
        />
      </nav>

      {/* Settings */}
      <div className="mt-auto">
        <button
          onClick={onSettingsClick}
          className="w-12 h-12 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Status Indicator */}
      <div className="mt-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
    </aside>
  );
};

export default Sidebar;
