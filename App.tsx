
import React, { useEffect, useState } from 'react';
import { Beer, BarChart3, Package, Settings, Bell, X, Menu, Activity, AlertTriangle, Droplets, TrendingUp } from 'lucide-react';
import { initSocket, disconnectSocket } from './services/socket';
import LiveTapView from './components/LiveTapView';
import InventoryManager from './components/InventoryManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BACKEND_URL, UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'analytics'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Application State
  const [tapState, setTapState] = useState<any>(null);
  const [kegState, setKegState] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [alert, setAlert] = useState<string | null>(null);

  // Config State
  const [config, setConfig] = useState({ mqtt_broker: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const socket = initSocket();

    socket.on('connect', () => {
        setIsConnected(true);
        setBackendError(false);
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => {
        setIsConnected(false);
    });

    socket.on('tap_update', (data) => setTapState(data));
    socket.on('keg_update', (data) => setKegState(data));
    socket.on('inventory_data', (data) => setInventory(data));
    socket.on('history_data', (data) => setHistory(data));
    socket.on('orders_data', (data) => setOrders(data));
    
    socket.on('alert', (data) => {
        setAlert(data.msg);
        setTimeout(() => setAlert(null), UI_CONSTANTS.ALERT_DURATION_MS);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('tap_update');
      disconnectSocket();
    };
  }, []);

  // Load Config when settings modal opens
  useEffect(() => {
      if (showSettings) {
          setBackendError(false);
          fetch(`${BACKEND_URL}/api/config`)
            .then(res => {
                if (!res.ok) throw new Error("Backend unavailable");
                return res.json();
            })
            .then(data => setConfig(data))
            .catch(err => {
                console.error("Failed to load config:", err);
                setBackendError(true);
            });
      }
  }, [showSettings]);

  const handleSaveConfig = () => {
      setSavingConfig(true);
      fetch(`${BACKEND_URL}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
      })
      .then(res => {
         if (!res.ok) throw new Error("Save failed");
         return res.json();
      })
      .then(() => {
          setSavingConfig(false);
          setAlert("Configuration Saved!");
          setShowSettings(false);
          setTimeout(() => setAlert(null), 3000);
      })
      .catch(() => {
          setSavingConfig(false);
          setAlert("Error saving configuration.");
          setTimeout(() => setAlert(null), 3000);
      });
  };

  const pct = tapState?.volume_remaining_pct || 0;
  const temp = kegState?.temp || 4.0;
  const flow = kegState?.flow || 0;
  const isPouring = tapState?.view === 'POURING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl shadow-2xl">
                    <Beer size={28} className="text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">SmartBar</h1>
                  <p className="text-xs text-slate-400 font-semibold">Tap System OS</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden lg:flex items-center gap-2">
              <NavButton 
                icon={<Activity size={20} />} 
                label="Live Dashboard" 
                active={activeView === 'dashboard'}
                onClick={() => setActiveView('dashboard')}
              />
              <NavButton 
                icon={<Package size={20} />} 
                label="Stock" 
                active={activeView === 'inventory'}
                onClick={() => setActiveView('inventory')}
              />
              <NavButton 
                icon={<BarChart3 size={20} />} 
                label="Analytics" 
                active={activeView === 'analytics'}
                onClick={() => setActiveView('analytics')}
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
                <div className="relative">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  {isConnected && (
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {isConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-2">
              <MobileNavButton 
                icon={<Activity size={20} />} 
                label="Live Dashboard" 
                active={activeView === 'dashboard'}
                onClick={() => { setActiveView('dashboard'); setShowMenu(false); }}
              />
              <MobileNavButton 
                icon={<Package size={20} />} 
                label="Stock Management" 
                active={activeView === 'inventory'}
                onClick={() => { setActiveView('inventory'); setShowMenu(false); }}
              />
              <MobileNavButton 
                icon={<BarChart3 size={20} />} 
                label="Analytics" 
                active={activeView === 'analytics'}
                onClick={() => { setActiveView('analytics'); setShowMenu(false); }}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Alert Banner */}
      {alert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400/30">
            <Bell size={20} className="animate-bounce" />
            <span className="font-bold text-lg">{alert}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
        
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Current Beer Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-600 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <Beer className="mb-4 text-amber-100" size={32} />
                  <h3 className="text-sm font-bold text-amber-100 uppercase tracking-wide mb-2">Now Serving</h3>
                  <p className="text-3xl font-black text-white mb-1">{tapState?.beer_name || 'No Keg'}</p>
                  <div className="flex items-center gap-2 text-amber-100">
                    <div className={`w-3 h-3 rounded-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <span className="font-bold text-lg">{pct}% Full</span>
                  </div>
                </div>
              </div>

              {/* Flow Status Card */}
              <div className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl transition-all ${
                isPouring 
                  ? 'bg-gradient-to-br from-emerald-600 to-green-600' 
                  : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <Droplets className={`mb-4 ${isPouring ? 'text-emerald-100 animate-pulse' : 'text-slate-500'}`} size={32} />
                  <h3 className={`text-sm font-bold uppercase tracking-wide mb-2 ${isPouring ? 'text-emerald-100' : 'text-slate-400'}`}>Flow Rate</h3>
                  <p className={`text-5xl font-black mb-1 ${isPouring ? 'text-white' : 'text-slate-400'}`}>{flow.toFixed(1)}</p>
                  <span className={`font-bold ${isPouring ? 'text-emerald-100' : 'text-slate-500'}`}>
                    LPM {isPouring && '• POURING'}
                  </span>
                </div>
              </div>

              {/* Temperature Card */}
              <div className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl ${
                temp > UI_CONSTANTS.HIGH_TEMP_WARNING
                  ? 'bg-gradient-to-br from-red-600 to-rose-600'
                  : 'bg-gradient-to-br from-blue-600 to-cyan-600'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? (
                    <AlertTriangle className="mb-4 text-red-100 animate-bounce" size={32} />
                  ) : (
                    <Activity className="mb-4 text-blue-100" size={32} />
                  )}
                  <h3 className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-100' : 'text-blue-100'
                  }`}>Temperature</h3>
                  <p className="text-5xl font-black text-white mb-1">{temp.toFixed(1)}<span className="text-3xl">°C</span></p>
                  <span className={`font-bold ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-100' : 'text-blue-100'
                  }`}>
                    {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'TOO WARM' : 'OPTIMAL'}
                  </span>
                </div>
              </div>

              {/* Keg ID Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <Package className="mb-4 text-purple-100" size={32} />
                  <h3 className="text-sm font-bold text-purple-100 uppercase tracking-wide mb-2">Active Keg</h3>
                  <p className="text-4xl font-black text-white mb-1">{kegState?.id || '---'}</p>
                  <span className="font-bold text-purple-100">Source ID</span>
                </div>
              </div>
            </div>

            {/* Detailed Live View */}
            <LiveTapView tapState={tapState} kegState={kegState} />
          </div>
        )}

        {activeView === 'inventory' && <InventoryManager inventory={inventory} orders={orders} />}
        {activeView === 'analytics' && <AnalyticsDashboard history={history} />}

      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl">
                    <Settings size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">System Settings</h2>
                    <p className="text-slate-400 mt-1">Configure backend connectivity</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {backendError && (
                <div className="mb-6 p-6 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-bold text-red-400 text-lg mb-1">Backend Offline</h3>
                    <p className="text-red-300 text-sm">Could not connect to {BACKEND_URL}. Ensure the server is running.</p>
                  </div>
                </div>
              )}

              <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">MQTT Broker URL</label>
                  <input 
                    type="text" 
                    value={config.mqtt_broker}
                    onChange={(e) => setConfig({...config, mqtt_broker: e.target.value})}
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white text-lg font-mono focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                    placeholder="mqtt://hostname:port"
                  />
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Supports <code className="bg-slate-800 px-2 py-1 rounded">mqtt://</code>, <code className="bg-slate-800 px-2 py-1 rounded">tcp://</code>, and <code className="bg-slate-800 px-2 py-1 rounded">ws://</code> protocols.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold border-2 border-slate-700 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 shadow-xl text-lg"
                  >
                    {savingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;
