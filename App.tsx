
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
    <div className="min-h-screen bg-[#0a0e1a] text-white font-sans flex">
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-gradient-to-b from-[#151928] to-[#0f1420] border-r border-[#2a3350] flex flex-col sticky top-0 h-screen shrink-0 transition-all shadow-2xl">
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[#2a3350] bg-[#1a1f35]/50">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Beer className="text-white" size={28} />
            </div>
            <span className="ml-4 font-black text-2xl tracking-tight hidden lg:block text-white">SmartBar</span>
        </div>

        <nav className="flex-1 p-4 space-y-3">
            <SidebarItem icon={<LayoutDashboard size={22} />} label="Live Monitor" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
            <SidebarItem icon={<Beer size={22} />} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={<BarChart3 size={22} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <div className="pt-6">
                 <SidebarItem icon={<Settings size={22} />} label="Settings" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            </div>
        </nav>

        <div className="p-5 border-t border-[#2a3350] hidden lg:block bg-[#0a0e1a]/30">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1f35]/50">
                <div className="relative">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {isConnected && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                    {isConnected ? 'System Online' : 'Disconnected'}
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0e1a]">
        {/* Header */}
        <header className="h-24 border-b border-[#2a3350] bg-[#151928]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
            <div>
                <h1 className="text-3xl font-black text-white capitalize tracking-tight">{activeTab === 'config' ? 'Settings' : activeTab}</h1>
                <p className="text-sm text-slate-400 mt-0.5">Main Bar • Line A</p>
            </div>
            
            <div className="flex items-center gap-6">
                {/* Alert Banner */}
                {alert && (
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-3 shadow-lg glow-accent alert-banner">
                        <Bell size={18} /> {alert}
                    </div>
                )}
                
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center border border-blue-400/20 shadow-lg">
                        <span className="font-black text-lg text-white">TS</span>
                    </div>
                </div>
            </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a]">
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
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-[#1a1f35] to-[#151928] p-8 rounded-2xl border border-[#2a3350] shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white border border-blue-400/20 shadow-lg">
                                <Settings size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">System Configuration</h2>
                                <p className="text-slate-400 text-sm mt-1">Manage backend connectivity and broker settings</p>
                            </div>
                        </div>

                        {backendError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6 flex items-center gap-4 text-red-200">
                                <div className="p-3 bg-red-500/20 rounded-xl">
                                    <WifiOff size={24} className="text-red-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Backend Offline</div>
                                    <div className="text-sm opacity-90 mt-1">Could not connect to local server at {BACKEND_URL}. Ensure server.js is running.</div>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-6 ${backendError ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">MQTT Broker URL</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={config.mqtt_broker}
                                        onChange={(e) => setConfig({...config, mqtt_broker: e.target.value})}
                                        className="w-full bg-[#0a0e1a] border-2 border-[#2a3350] rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm shadow-inner transition-all"
                                        placeholder="mqtt://hostname:port"
                                    />
                                    <div className="absolute right-4 top-4 text-xs font-bold">
                                        {isConnected ? <span className="text-green-400">● CONNECTED</span> : <span className="text-slate-500">DISCONNECTED</span>}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                    Supports <span className="font-mono bg-[#1a1f35] px-2 py-0.5 rounded text-slate-300">mqtt://</span>, <span className="font-mono bg-[#1a1f35] px-2 py-0.5 rounded text-slate-300">tcp://</span>, and <span className="font-mono bg-[#1a1f35] px-2 py-0.5 rounded text-slate-300">ws://</span> protocols.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-[#2a3350] flex justify-end">
                                <button 
                                    onClick={handleSaveConfig}
                                    disabled={savingConfig}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl text-base"
                                >
                                    {savingConfig ? (
                                        <>Saving...</>
                                    ) : (
                                        <><Save size={20} /> Save Configuration</>
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
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-semibold text-sm ${
            active 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30' 
            : 'text-slate-400 hover:bg-[#1a1f35] hover:text-white'
        }`}
    >
        <div className="shrink-0">{icon}</div>
        <span className="hidden lg:block">{label}</span>
    </button>
);

export default App;
