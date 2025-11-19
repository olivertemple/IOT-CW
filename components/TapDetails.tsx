import React, { useMemo } from 'react';
import { Tap } from '../types';
import { X, ArrowDown, Circle, Scale, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TapDetailsProps {
  tap: Tap;
  onClose: () => void;
    onDeleteTap?: (tapId: string) => void;
}

export const TapDetails: React.FC<TapDetailsProps> = ({ tap, onClose, onDeleteTap }) => {
  
  const pintsTotal = tap.totalConsumedLiters / 0.568261; 
  const revenue = pintsTotal * tap.pricePerPint;
  const margin = revenue > 0 ? (((revenue - (tap.totalConsumedLiters / tap.kegSizeLiters) * tap.costPerKeg) / revenue) * 100).toFixed(1) : '0';

  const historyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 2}:00`,
      val: Math.floor(Math.random() * 50) + 10
    }));
  }, [tap.id]);

  const percentage = (tap.currentLevelLiters / tap.kegSizeLiters) * 100;
  
    // Prefer per-keg data when available
    const activeKeg = (tap as any).kegs && (tap as any).kegs.length
        ? (tap as any).kegs.find((k: any) => k.status === 'active') || (tap as any).kegs[0]
        : null;

    // Calculate implied volume from active keg weight (fall back to top-level fields)
    const impliedVolume = activeKeg
        ? (activeKeg.weightCurrent - activeKeg.weightEmpty) / 1.03
        : (tap.kegWeightCurrent - tap.kegWeightEmpty) / 1.03;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
            <div>
                <h2 className="text-xl font-semibold text-white">{tap.beerName}</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">{tap.id} • {tap.beerType}</p>
            </div>
                                                <div className="flex items-center gap-3">
                                                    {onDeleteTap && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Delete tap "${tap.name}"? This cannot be undone.`)) {
                                                                    onDeleteTap(tap.id);
                                                                    onClose();
                                                                }
                                                            }}
                                                            className="text-red-400 hover:text-red-300 transition-colors mr-2"
                                                            aria-label="Delete tap"
                                                            title="Delete tap"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                                            <X className="w-5 h-5" />
                                                    </button>
                                                </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Left: Valve Chain Visual */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-6">Valve Chain Topology</h3>
                    <div className="relative flex flex-col items-start gap-6 pl-4 border-l border-zinc-800">
                        
                        {/* Node 1: Tap */}
                        <div className="flex items-center gap-4">
                             <div className="w-2 h-2 -ml-[21px] rounded-full bg-white border-2 border-[#09090b]" />
                             <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg w-64 flex justify-between items-center">
                                 <span className="text-xs font-medium text-white">Tap Output</span>
                                 {tap.isFlowing && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                             </div>
                        </div>

                        {/* Node 2+: Keg Chain (active + reserves) */}
                        {((tap as any).kegs || [{ status: 'active' }]).map((k: any, idx: number) => {
                             const isActive = k.status === 'active';
                             const implied = k.weightCurrent && k.weightEmpty ? Math.max(0, (k.weightCurrent - k.weightEmpty) / 1.03) : 0;
                             const pct = Math.min(100, Math.round((implied / (k.sizeLiters || tap.kegSizeLiters)) * 100));
                             return (
                               <div key={idx} className="flex items-center gap-4">
                                 <div className={`w-2 h-2 -ml-[21px] rounded-full border-2 border-[#09090b] ${isActive ? 'bg-white' : (k.status === 'reserve' ? 'bg-zinc-500' : 'bg-zinc-800')}`} />
                                 <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg w-64 space-y-2">
                                     <div className="flex justify-between text-xs">
                                         <span className="text-white">{isActive ? 'Active Keg' : (k.status === 'reserve' ? 'Reserve Keg' : 'Empty Keg')}</span>
                                         <span className="text-zinc-500">{pct}%</span>
                                     </div>
                                     <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                         <div className="h-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
                                     </div>
                                 </div>
                               </div>
                             );
                        })}

                        {/* Node 3: Valve Box */}
                        <div className="flex items-center gap-4">
                             <div className="w-2 h-2 -ml-[21px] rounded-full bg-zinc-500 border-2 border-[#09090b]" />
                             <div className="text-xs text-zinc-500 font-mono px-3 py-1 border border-zinc-800 rounded bg-zinc-900/50">
                                 VALVE_CONTROLLER_ID_442
                             </div>
                        </div>

                        {/* Node 4: Spares (visual fallback) */}
                        <div className="flex flex-col gap-3 pt-2">
                             {Array.from({length: Math.max(3, tap.spareKegs || 0)}).map((_, i) => (
                                 <div key={i} className="flex items-center gap-4">
                                    <div className={`w-2 h-2 -ml-[21px] rounded-full border-2 border-[#09090b] ${i < (tap.spareKegs || 0) ? 'bg-zinc-500' : 'bg-zinc-800'}`} />
                                    <div className={`text-xs ${i < (tap.spareKegs || 0) ? 'text-zinc-400' : 'text-zinc-700'} flex items-center gap-2`}>
                                        <Circle className="w-3 h-3 fill-current" />
                                        {i < (tap.spareKegs || 0) ? 'Reserve Unit' : 'Empty Slot'}
                                    </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Right: Data */}
                <div className="space-y-8">
                    
                    {/* Physical Stats */}
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 border border-zinc-800 rounded-xl flex items-start justify-between">
                             <div>
                                 <div className="text-zinc-500 text-[10px] uppercase flex items-center gap-1"><Scale className="w-3 h-3" /> Current Weight</div>
                                 <div className="text-lg font-medium text-white mt-1">{(activeKeg ? activeKeg.weightCurrent : tap.kegWeightCurrent).toFixed(2)} kg</div>
                                 <div className="text-[10px] text-zinc-600 mt-1">Tare: {(activeKeg ? activeKeg.weightEmpty : tap.kegWeightEmpty)}kg</div>
                             </div>
                             <div className="text-right">
                                <div className="text-[10px] text-zinc-500">Implied Vol</div>
                                <div className="text-xs text-zinc-300 font-mono">{impliedVolume.toFixed(1)}L</div>
                             </div>
                         </div>

                         <div className="p-4 border border-zinc-800 rounded-xl">
                             <div className="text-zinc-500 text-[10px] uppercase flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperatures</div>
                             <div className="mt-2 space-y-1">
                                 <div className="flex justify-between text-xs">
                                     <span className="text-zinc-400">Product</span>
                                     <span className="text-white font-mono">{tap.temperature}°C</span>
                                 </div>
                                 <div className="flex justify-between text-xs">
                                     <span className="text-zinc-600">Cellar Ambient</span>
                                     <span className="text-zinc-400 font-mono">{tap.cellarTemp}°C</span>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-zinc-800 rounded-xl">
                            <div className="text-zinc-500 text-[10px] uppercase">Profit Margin</div>
                            <div className="text-xl font-medium text-white mt-1">{margin}%</div>
                        </div>
                        <div className="p-4 border border-zinc-800 rounded-xl">
                            <div className="text-zinc-500 text-[10px] uppercase">Unit Price</div>
                            <div className="text-xl font-medium text-white mt-1">${tap.pricePerPint.toFixed(2)}</div>
                        </div>
                        <div className="p-4 border border-zinc-800 rounded-xl col-span-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-zinc-500 text-[10px] uppercase">Total Revenue</div>
                                    <div className="text-2xl font-medium text-white mt-1">${revenue.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Chart */}
                    <div>
                        <div className="flex justify-between items-baseline mb-4">
                            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">24h Usage</h3>
                            <span className="text-xs text-white">{tap.totalConsumedLiters.toFixed(0)}L Total</span>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <Line type="step" dataKey="val" stroke="#fff" strokeWidth={1.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};