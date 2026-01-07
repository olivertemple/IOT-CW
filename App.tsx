
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Beer, BarChart3, Settings, Bell, Menu, Save, CheckCircle, WifiOff } from 'lucide-react';
import { initSocket, disconnectSocket } from './services/socket';
import LiveTapView from './components/LiveTapView';
import InventoryManager from './components/InventoryManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { BACKEND_URL } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('live');
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
        // Only show backend error on dashboard if socket completely fails
    });

    socket.on('tap_update', (data) => setTapState(data));
    socket.on('keg_update', (data) => setKegState(data));
    socket.on('inventory_data', (data) => setInventory(data));
    socket.on('history_data', (data) => setHistory(data));
    socket.on('orders_data', (data) => setOrders(data));
    
    socket.on('alert', (data) => {
        setAlert(data.msg);
        setTimeout(() => setAlert(null), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('tap_update');
      disconnectSocket();
    };
  }, []);

  // Load Config when tab is active
  useEffect(() => {
      if (activeTab === 'config') {
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
  }, [activeTab]);

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
          setAlert("Configuration Saved! Backend Reconnecting...");
          setTimeout(() => setAlert(null), 3000);
      })
      .catch(() => {
          setSavingConfig(false);
          setAlert("Error saving configuration.");
          setTimeout(() => setAlert(null), 3000);
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 h-screen shrink-0 transition-all">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Beer className="text-white" size={24} />
            </div>
            <span className="ml-3 font-bold text-xl tracking-tight hidden lg:block text-white">SmartBar</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <SidebarItem icon={<LayoutDashboard />} label="Live Monitor" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
            <SidebarItem icon={<Beer />} label="Inventory & Stock" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={<BarChart3 />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <div className="pt-8">
                 <SidebarItem icon={<Settings />} label="Configuration" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            </div>
        </nav>

        <div className="p-4 border-t border-slate-800 hidden lg:block">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                <div className="text-xs text-slate-500">
                    {isConnected ? 'System Online' : 'Disconnected'}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            
            <div className="flex items-center gap-6">
                {/* Alert Banner */}
                {alert && (
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse flex items-center gap-2 shadow-lg">
                        <Bell size={16} /> {alert}
                    </div>
                )}
                
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">Tap System 01</div>
                    <div className="text-xs text-slate-500">Main Bar • Line A</div>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                    <span className="font-bold text-blue-400">TS</span>
                </div>
            </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'live' && (
                <LiveTapView tapState={tapState} kegState={kegState} />
            )}
            {activeTab === 'inventory' && (
                <InventoryManager inventory={inventory} orders={orders} />
            )}
            {activeTab === 'analytics' && (
                <AnalyticsDashboard history={history} />
            )}
             {activeTab === 'config' && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-800 rounded-lg text-blue-400 border border-slate-700">
                                <Settings size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">System Configuration</h2>
                                <p className="text-slate-400 text-sm">Manage backend connectivity and broker settings.</p>
                            </div>
                        </div>

                        {backendError && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-4 text-red-200">
                                <div className="p-2 bg-red-500/20 rounded-full">
                                    <WifiOff size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <div className="font-bold">Backend Offline</div>
                                    <div className="text-xs opacity-75">Could not connect to local server at {BACKEND_URL}. Ensure server.js is running.</div>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">MQTT Broker URL</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={config.mqtt_broker}
                                        onChange={(e) => setConfig({...config, mqtt_broker: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-inner"
                                        placeholder="mqtt://hostname:port"
                                    />
                                    <div className="absolute right-3 top-3 text-slate-600 text-xs">
                                        {isConnected ? <span className="text-green-500 font-bold">CONNECTED</span> : 'DISCONNECTED'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Supports <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">mqtt://</span>, <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">tcp://</span>, and <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">ws://</span> protocols.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-800 flex justify-end">
                                <button 
                                    onClick={handleSaveConfig}
                                    disabled={savingConfig}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    {savingConfig ? (
                                        <>Saving...</>
                                    ) : (
                                        <><Save size={18} /> Save Configuration</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        }`}
    >
        <div className="shrink-0">{icon}</div>
        <span className="font-medium text-sm hidden lg:block">{label}</span>
    </button>
);

export default App;
