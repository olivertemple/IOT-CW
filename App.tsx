
import React, { useState, useEffect, useRef } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { TapCard } from './components/TapCard';
import { TapDetails } from './components/TapDetails';
import { Analytics } from './components/Analytics';
import { Stock } from './components/Stock';
import { Tap, BeerType, IoTUpdatePayload } from './types';
import { INITIAL_TAPS } from './services/mockMqttService'; 
import { mqttService, mergeMqttData } from './services/mqttService';
import { apiService } from './services/apiService';
import { Wifi, AlertCircle, Database, Server, Thermometer, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [taps, setTaps] = useState<Tap[]>(INITIAL_TAPS);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTapId, setSelectedTapId] = useState<string | null>(null);
  // Default to live MQTT + backend persistence as requested
  const [backendStatus, setBackendStatus] = useState(true);
  
  // MQTT Settings
  // Default to Live MQTT on startup
  const [useRealMqtt, setUseRealMqtt] = useState(true);
  // Default broker URL: use same-origin path `/mqtt` so nginx can proxy websocket
  // If the page is served over HTTPS, use `wss`, otherwise `ws`.
  const [brokerUrl, setBrokerUrl] = useState(() => {
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const proto = isSecure ? 'wss' : 'ws';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:9001';
      return `${proto}://${host}/mqtt`;
    } catch (e) {
      return 'ws://localhost:9001';
    }
  });

  // 1. Initial Load from Backend DB
  useEffect(() => {
    const loadTaps = async () => {
      try {
        const dbTaps = await apiService.getTaps();
        setBackendStatus(true); // Backend is reachable

        if (dbTaps.length > 0) {
          console.debug('App: loaded taps from API', dbTaps);
          setTaps(dbTaps);
        } else {
          // Backend is online but empty. Seed it with initial mock data.
          console.log("Database empty. Seeding initial data...");
          const seedPromises = INITIAL_TAPS.map(tap => apiService.saveTap(tap));
          await Promise.all(seedPromises);
          // Keep using INITIAL_TAPS state
        }
      } catch (e) {
        console.warn("Backend API unavailable, using local fallback data.", e);
        setBackendStatus(false);
      }
    };
    loadTaps();
  }, []);

  // 2. MQTT Connection Handling
  useEffect(() => {
    if (!useRealMqtt) {
        mqttService.disconnect();
        setIsConnected(false);
        return;
    }

    const handleMqttMessage = (tapId: string, payload: IoTUpdatePayload) => {
      setTaps(currentTaps => {
        return currentTaps.map(tap => {
          if (tap.id === tapId) {
            return mergeMqttData(tap, payload);
          }
          return tap;
        });
      });
    };

    mqttService.connect(brokerUrl, handleMqttMessage, (status) => {
      setIsConnected(status);
    });

    return () => {
      mqttService.disconnect();
    };
  }, [useRealMqtt, brokerUrl]);

  // 3. Simulation Loop (Fallback if Real MQTT is off)
  useEffect(() => {
    if (useRealMqtt) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    import('./services/mockMqttService').then(({ simulateFlow }) => {
      if (cancelled) return;
      intervalId = setInterval(() => {
        setTaps(currentTaps => simulateFlow(currentTaps));
        // Simulation is not a real MQTT connection; keep connection flag false
        setIsConnected(false);
      }, 1000);
    }).catch(() => {
      // ignore import errors in dev
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [useRealMqtt]);

  const selectedTap = taps.find(t => t.id === selectedTapId);
  
  const avgCellarTemp = taps.length > 0 
    ? (taps.reduce((acc, t) => acc + t.cellarTemp, 0) / taps.length).toFixed(1) 
    : '--';

  const handleUpdateStock = (tapId: string, change: number) => {
    setTaps(currentTaps => currentTaps.map(t => {
      if (t.id === tapId) {
        const updated = { ...t, spareKegs: Math.max(0, t.spareKegs + change) };
        // Optimistically update UI, then save to DB
        if (backendStatus) apiService.saveTap(updated); 
        return updated;
      }
      return t;
    }));
  };

  const handleAddTap = async (newTapData: any) => {
    const newTap: Tap = {
        id: `tap-${Date.now().toString().slice(-6)}`,
        name: newTapData.name,
        beerName: newTapData.beerName,
        beerType: newTapData.beerType,
        kegSizeLiters: Number(newTapData.kegSizeLiters),
        currentLevelLiters: Number(newTapData.kegSizeLiters), 
        totalConsumedLiters: 0,
        temperature: 4.0, 
        isFlowing: false,
        lastKegSwap: new Date().toISOString(),
        status: 'active',
        pricePerPint: Number(newTapData.pricePerPint),
        costPerKeg: Number(newTapData.costPerKeg),
        spareKegs: Number(newTapData.spareKegs),
        kegWeightCurrent: (Number(newTapData.kegSizeLiters) * 1.03) + 13.5,
        kegWeightEmpty: 13.5,
        cellarTemp: 11.0
    };

    setTaps(prev => [...prev, newTap]);
    
    // Persist to DB
    if (backendStatus) {
      try {
        await apiService.saveTap(newTap);
      } catch (e) {
        console.error("Failed to save tap to DB");
      }
    }
  };

  const handleDeleteTap = async (tapId: string) => {
    // Optimistic UI remove
    setTaps(prev => prev.filter(t => t.id !== tapId));
    if (backendStatus) {
      try {
        await apiService.deleteTap(tapId);
      } catch (e) {
        console.error('Failed to delete tap from DB', e);
        // Re-fetch taps to recover state
        try {
          const dbTaps = await apiService.getTaps();
          setTaps(dbTaps);
        } catch (err) {
          console.error('Failed to reload taps after delete failure', err);
        }
      }
    }
    // Close details view if it was the deleted tap
    if (selectedTapId === tapId) setSelectedTapId(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Active Taps</h2>
                  {!backendStatus && <p className="text-xs text-red-400 mt-1">⚠ Backend Offline - Data will not persist</p>}
                </div>
                <button 
                    onClick={() => setUseRealMqtt(!useRealMqtt)}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${useRealMqtt ? (isConnected ? 'text-emerald-500' : 'text-amber-500') : 'text-blue-400'}`}
                >
                    {useRealMqtt ? (
                        <>
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            {isConnected ? 'Live MQTT' : 'Connecting...'}
                        </>
                    ) : (
                        <>
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                             Simulation Mode
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {taps.map(tap => (
                <TapCard 
                  key={tap.id} 
                  tap={tap} 
                  onClick={() => setSelectedTapId(tap.id)}
                />
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatBlock label="Total Daily Flow" value="412.5 L" />
                <StatBlock label="Active Kegs" value={`${taps.length} Units`} />
                <StatBlock label="Live Source" value={useRealMqtt ? 'MQTT/WS' : 'Simulated'} />
                <StatBlock label="Persistence" value={backendStatus ? 'SQLite (Active)' : 'Memory (Volatile)'} />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-500">
            <Analytics taps={taps} />
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="animate-in fade-in duration-500">
            <Stock 
                taps={taps} 
                onUpdateStock={handleUpdateStock} 
                onAddTap={handleAddTap}
                onDeleteTap={handleDeleteTap}
            />
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <SettingsIcon />
                        <h2 className="text-lg font-semibold text-white">Configuration</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Database Status</label>
                            <div className={`w-full bg-zinc-950 border rounded-lg px-4 py-2 text-sm flex items-center gap-2 ${backendStatus ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                                <Database className="w-4 h-4" />
                                {backendStatus ? 'Connected to SQLite' : 'Disconnected (Run node server.js)'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Connection Mode</label>
                                <span className={`text-xs ${useRealMqtt ? 'text-emerald-500' : 'text-blue-400'}`}>{useRealMqtt ? 'Live WebSocket' : 'Internal Simulation'}</span>
                            </div>
                            <button 
                                onClick={() => setUseRealMqtt(!useRealMqtt)}
                                className={`w-full bg-zinc-950 border rounded-lg px-4 py-3 text-sm text-left text-zinc-300 font-mono transition-colors flex justify-between items-center ${useRealMqtt ? 'border-emerald-500/30 ring-1 ring-emerald-500/30' : 'border-zinc-800 hover:border-zinc-600'}`}
                            >
                                <span>{useRealMqtt ? 'Active: Real Device Stream' : 'Active: Simulation Loop'}</span>
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                            </button>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Broker URL (WebSocket)</label>
                             <input 
                                type="text" 
                                value={brokerUrl} 
                                onChange={(e) => setBrokerUrl(e.target.value)}
                                placeholder="wss://test.mosquitto.org:8081"
                                disabled={isConnected && useRealMqtt}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:border-emerald-500/50 disabled:opacity-50" 
                             />
                        </div>
                    </div>
                </div>
           </div>
        )}

      </main>
      
      {selectedTap && (
        <TapDetails tap={selectedTap} onClose={() => setSelectedTapId(null)} onDeleteTap={handleDeleteTap} />
      )}
    </div>
  );
};

const StatBlock = ({ label, value }: { label: string, value: string }) => (
    <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</div>
        <div className="text-2xl font-light text-white tracking-tight">{value}</div>
    </div>
);

const SettingsIcon = () => (
    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
        <Server className="w-4 h-4 text-white" />
    </div>
);

export default App;
