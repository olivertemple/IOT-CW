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

  const { socket, isConnected } = useSocketConnection();
  const allTaps = useTapData(socket, isConnected);
  const { inventory, orders } = useInventoryData(socket, isConnected);
  const history = useHistoryData(socket);
  const { alert, showAlert } = useAlerts(socket);

  useEffect(() => {
    if (!selectedTap) return;
    const found = allTaps.find(t => t.tapId === selectedTap);
    if (found) {
      setTapState(found.tap || null);
      setKegState(found.activeKeg || null);
    }
  }, [selectedTap, allTaps]);

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
    <div className="min-h-screen bg-mist text-ink relative">
      <div className="app-noise" />

      <Sidebar
        activeView={activeView}
        isConnected={isConnected}
        onViewChange={setActiveView}
        onSettingsClick={() => setShowSettings(true)}
      />

      {alert && <AlertToast message={alert} />}

      <main className="ml-[120px] px-10 py-10 relative z-10">
        <header className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">SmartBar Control</p>
                <h1 className="text-4xl font-display text-ink mt-2">
                  {activeView === 'taps' ? 'Tap Systems' :
                    activeView === 'dashboard' ? 'Live Pour Room' :
                      activeView === 'inventory' ? 'Keg Inventory' : 'Usage Analytics'}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone rounded-full text-sm font-semibold">
                  <Circle className={`w-2 h-2 ${isConnected ? 'fill-pine text-pine' : 'fill-ember text-ember'}`} />
                  {isConnected ? 'Online' : 'Offline'}
                </div>
                {connectedCount > 0 && (
                  <div className="px-4 py-2 bg-white border border-stone rounded-full text-sm font-semibold text-pine">
                    {connectedCount} Tap{connectedCount === 1 ? '' : 's'} Connected
                  </div>
                )}
              </div>
            </div>
            {selectedTap && activeView !== 'taps' && (
              <div className="flex items-center gap-3 text-sm text-ink/70">
                <span className="px-3 py-1 rounded-full bg-white border border-stone">Active Tap</span>
                <span className="font-semibold">{selectedTap}</span>
              </div>
            )}
          </div>
        </header>

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
