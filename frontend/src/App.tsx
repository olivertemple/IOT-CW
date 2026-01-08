import React, { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { BACKEND_URL } from './constants';
import { useSocketConnection, useTapData } from './hooks/useTapData';
import { useInventoryData } from './hooks/useInventoryData';
import { useHistoryData } from './hooks/useHistoryData';
import { useAlerts } from './hooks/useAlerts';
import Sidebar from './components/common/Sidebar';
import AlertToast from './components/common/AlertToast';
import SettingsModal from './components/common/SettingsModal';
import TapsOverview from './components/tap/TapsOverview';
import DashboardView from './components/tap/DashboardView';
import InventoryManager from './components/InventoryManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'analytics' | 'taps'>('taps');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTap, setSelectedTap] = useState<string | null>(null);
  const [tapState, setTapState] = useState<any>(null);
  const [kegState, setKegState] = useState<any>(null);
  
  // Custom hooks for data management
  const { socket, isConnected } = useSocketConnection();
  const allTaps = useTapData(socket, isConnected);
  const { inventory, orders } = useInventoryData(socket, isConnected, selectedTap);
  const history = useHistoryData(socket);
  const { alert, showAlert } = useAlerts(socket);

  // Keep selected tap's detailed state in sync
  useEffect(() => {
    if (!selectedTap) return;
    const found = allTaps.find(t => t.tapId === selectedTap);
    if (found) {
      setTapState(found.tap || null);
      setKegState(found.activeKeg || null);
    }
  }, [selectedTap, allTaps]);

  // Auto-select first tap if none selected
  useEffect(() => {
    if (!selectedTap && allTaps.length > 0) {
      setSelectedTap(allTaps[0].tapId);
    }
  }, [allTaps, selectedTap]);

  const handleTapSelect = (tapId: string, tap: any, keg: any) => {
    setSelectedTap(tapId);
    setTapState(tap);
    setKegState(keg);
    setActiveView('dashboard');
  };

  const handleDeleteTap = (tapId: string) => {
    if (!confirm(`Are you sure you want to disconnect tap "${tapId}"?`)) return;
    
    fetch(`${BACKEND_URL}/api/taps/${tapId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        if (selectedTap === tapId) {
          setSelectedTap(null);
          setActiveView('taps');
        }
        showAlert(`Tap ${tapId} disconnected`);
      })
      .catch(err => {
        console.error('Failed to delete tap:', err);
        showAlert(`Error disconnecting tap ${tapId}`);
      });
  };

  const connectedCount = allTaps.filter(t => t.isConnected).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Sidebar
        activeView={activeView}
        isConnected={isConnected}
        onViewChange={setActiveView}
        onSettingsClick={() => setShowSettings(true)}
      />

      {alert && <AlertToast message={alert} />}

      <main className="ml-20 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {activeView === 'taps' ? 'All Tap Systems' : 
                 activeView === 'dashboard' ? 'Live Dashboard' : 
                 activeView === 'inventory' ? 'Stock Management' : 'Analytics'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
                <Circle className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              {connectedCount > 0 && (
                <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-sm font-semibold text-indigo-700">
                    {connectedCount} {connectedCount === 1 ? 'Tap' : 'Taps'} Connected
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Views */}
        {activeView === 'taps' && (
          <TapsOverview
            taps={allTaps}
            onTapSelect={handleTapSelect}
            onTapDelete={handleDeleteTap}
          />
        )}

        {activeView === 'dashboard' && selectedTap && (
          <DashboardView
            allTaps={allTaps}
            selectedTap={selectedTap}
            tapState={tapState}
            kegState={kegState}
            onTapChange={(tapId) => {
              setSelectedTap(tapId);
              const tap = allTaps.find(t => t.tapId === tapId);
              if (tap) {
                setTapState(tap.tap);
                setKegState(tap.activeKeg);
              }
            }}
            onBackToTaps={() => setActiveView('taps')}
          />
        )}

        {activeView === 'inventory' && (
          <InventoryManager inventory={inventory} orders={orders} />
        )}

        {activeView === 'analytics' && (
          <AnalyticsDashboard history={history} />
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={showAlert}
      />
    </div>
  );
};

export default App;
