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
import AuthPage from './components/common/AuthPage';
import TapsOverview from './components/tap/TapsOverview';
import DashboardView from './components/tap/DashboardView';
import InventoryManager from './components/InventoryManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'analytics' | 'taps'>('taps');
  const [showSettings, setShowSettings] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('authToken') : null);
  const [selectedTap, setSelectedTap] = useState<string | null>(null);
  const [tapState, setTapState] = useState<any>(null);
  const [kegState, setKegState] = useState<any>(null);

  const { socket, isConnected } = useSocketConnection();
  const allTaps = useTapData(socket, isConnected);
  const { inventory, orders } = useInventoryData(socket, isConnected);
  const history = useHistoryData(socket);
  const { alert, showAlert } = useAlerts(socket);

  useEffect(() => {
    // If not authenticated, show the AuthPage
    if (!authToken) {
      return (
        <AuthPage
          onLogin={(token: string) => {
            localStorage.setItem('authToken', token);
            setAuthToken(token);
          }}
        />
      );
    }

    return (
      <div className="app-shell text-ink relative">

        <Sidebar
          activeView={activeView}
          isConnected={isConnected}
          onViewChange={setActiveView}
          onSettingsClick={() => setShowSettings(true)}
          connectedCount={connectedCount}
        />

        {alert && <AlertToast message={alert} />}

        <main className="px-8 pb-16 pt-36 relative z-10 max-w-[1400px] mx-auto">

          <section className="space-y-10">
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
          </section>
        </main>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={showAlert}
        />
      </div>
    );
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
        </section>
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
