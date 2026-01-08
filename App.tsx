import React, { useEffect, useState } from 'react';
import { Beer, BarChart3, Package, Settings, Circle, X } from 'lucide-react';
import { initSocket, disconnectSocket } from './services/socket';
import LiveTapView from './components/LiveTapView';
import InventoryManager from './components/InventoryManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BACKEND_URL, UI_CONSTANTS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'analytics'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      
      {/* Sidebar Navigation */}
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
            icon={<BarChart3 size={24} />} 
            label="Dashboard"
            active={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />
          <NavIcon 
            icon={<Package size={24} />} 
            label="Stock"
            active={activeView === 'inventory'}
            onClick={() => setActiveView('inventory')}
          />
          <NavIcon 
            icon={<BarChart3 size={24} />} 
            label="Analytics"
            active={activeView === 'analytics'}
            onClick={() => setActiveView('analytics')}
          />
        </nav>

        {/* Settings */}
        <div className="mt-auto">
          <button
            onClick={() => setShowSettings(true)}
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

      {/* Alert Toast */}
      {alert && (
        <div className="fixed top-6 right-6 z-50 animate-slideDown">
          <div className="bg-white border border-gray-200 shadow-lg px-6 py-4 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            <span className="font-medium text-gray-900">{alert}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="ml-20 p-8">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {activeView === 'dashboard' ? 'Live Dashboard' : activeView === 'inventory' ? 'Stock Management' : 'Analytics'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
                <Circle className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Current Beer */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Beer className="text-indigo-600" size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Now Serving</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tapState?.beer_name || 'No Keg'}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-600 font-medium">{pct}% Full</span>
                </div>
              </div>

              {/* Flow Status */}
              <div className={`border rounded-2xl p-6 ${
                isPouring 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isPouring ? 'bg-green-200' : 'bg-gray-100'
                  }`}>
                    <BarChart3 className={isPouring ? 'text-green-700' : 'text-gray-600'} size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flow Rate</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{flow.toFixed(1)}</h3>
                <span className={`text-sm font-medium ${isPouring ? 'text-green-700' : 'text-gray-600'}`}>
                  LPM {isPouring && '• Pouring'}
                </span>
              </div>

              {/* Temperature */}
              <div className={`border rounded-2xl p-6 ${
                temp > UI_CONSTANTS.HIGH_TEMP_WARNING
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-red-200' : 'bg-blue-200'
                  }`}>
                    <Beer className={temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-700' : 'text-blue-700'} size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temperature</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{temp.toFixed(1)}°C</h3>
                <span className={`text-sm font-medium ${
                  temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'Too Warm' : 'Optimal'}
                </span>
              </div>

              {/* Keg ID */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="text-purple-600" size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Keg</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{kegState?.id || '---'}</h3>
                <span className="text-sm text-gray-600 font-medium">Source ID</span>
              </div>
            </div>

            {/* Detailed View */}
            <LiveTapView tapState={tapState} kegState={kegState} />
          </div>
        )}

        {activeView === 'inventory' && <InventoryManager inventory={inventory} orders={orders} />}
        {activeView === 'analytics' && <AnalyticsDashboard history={history} />}

      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Settings size={28} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                    <p className="text-gray-600 mt-1">Configure backend connectivity</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {backendError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Backend Offline</h3>
                    <p className="text-red-700 text-sm">Could not connect to {BACKEND_URL}. Ensure the server is running.</p>
                  </div>
                </div>
              )}

              <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">MQTT Broker URL</label>
                  <input 
                    type="text" 
                    value={config.mqtt_broker}
                    onChange={(e) => setConfig({...config, mqtt_broker: e.target.value})}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="mqtt://hostname:port"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Supports <code className="bg-gray-100 px-2 py-0.5 rounded">mqtt://</code>, <code className="bg-gray-100 px-2 py-0.5 rounded">tcp://</code>, and <code className="bg-gray-100 px-2 py-0.5 rounded">ws://</code> protocols.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-all text-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 text-white"
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

const NavIcon = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export default App;
