import React, { useState } from 'react';
import { Tap, BeerType } from '../types';
import { Package, Plus, Minus, AlertTriangle, X, Save } from 'lucide-react';

interface StockProps {
  taps: Tap[];
  onUpdateStock: (tapId: string, change: number) => void;
  onAddTap: (data: any) => void;
  onDeleteTap?: (tapId: string) => void;
}

export const Stock: React.FC<StockProps> = ({ taps, onUpdateStock, onAddTap, onDeleteTap }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    beerName: '',
    beerType: BeerType.LAGER,
    kegSizeLiters: 50,
    pricePerPint: '',
    costPerKeg: '',
    spareKegs: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.beerName || !formData.pricePerPint) return;
    
    onAddTap(formData);
    setIsAdding(false);
    setFormData({
        name: '',
        beerName: '',
        beerType: BeerType.LAGER,
        kegSizeLiters: 50,
        pricePerPint: '',
        costPerKeg: '',
        spareKegs: 0
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Inventory Management</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage connected kegs and reserve stock</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded-lg border border-white/5 text-xs text-zinc-400">
                <Package className="w-3.5 h-3.5" />
                Total Assets: {taps.reduce((acc, t) => acc + t.spareKegs + 1, 0)} Kegs
             </div>
             <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors"
             >
                <Plus className="w-3.5 h-3.5" />
                Register Tap
             </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {taps.map(tap => {
             const totalVolume = tap.currentLevelLiters + (tap.spareKegs * tap.kegSizeLiters);
             // Assume a "full" inventory context is 4 kegs (1 active + 3 spares) for visualization scaling
             const maxCapacity = tap.kegSizeLiters * 4; 
             const stockLevel = (totalVolume / maxCapacity) * 100;
             const isLow = tap.spareKegs === 0 && tap.currentLevelLiters < (tap.kegSizeLiters * 0.2);

             return (
               <div key={tap.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-900/30 transition-colors group">
                  
                  {/* Beer Info */}
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLow ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                      {isLow ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{tap.beerName}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">{tap.beerType} • {tap.kegSizeLiters}L Kegs</span>
                      <div className="text-[10px] text-zinc-600 md:hidden mt-1">{tap.name}</div>
                    </div>
                  </div>

                  {/* Volume Visual */}
                  <div className="flex-1 md:max-w-md space-y-2">
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Total Volume Available</span>
                        <span className="text-white font-mono">{totalVolume.toFixed(1)}L</span>
                     </div>
                     <div className="relative h-2 w-full bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(stockLevel, 100)}%` }} 
                        />
                        {/* Markers for kegs */}
                        <div className="absolute inset-0 flex justify-evenly opacity-20">
                            <div className="w-px h-full bg-white"></div>
                            <div className="w-px h-full bg-white"></div>
                            <div className="w-px h-full bg-white"></div>
                        </div>
                     </div>
                     <div className="text-[10px] text-zinc-600 flex gap-4">
                        <span>Active: {(tap.currentLevelLiters / tap.kegSizeLiters * 100).toFixed(0)}%</span>
                        <span className="text-zinc-500">|</span>
                        <span>Reserves: {tap.spareKegs * tap.kegSizeLiters}L</span>
                     </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                      <div className="text-right mr-2 hidden md:block">
                        <div className="text-xs text-zinc-400">Replenish</div>
                        <div className="text-[10px] text-zinc-600">Update Stock</div>
                      </div>
                      
                      <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                          <button 
                            onClick={() => onUpdateStock(tap.id, -1)}
                            disabled={tap.spareKegs <= 0}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="w-12 text-center">
                              <div className="text-sm font-medium text-white">{tap.spareKegs}</div>
                          </div>

                          <button 
                            onClick={() => onUpdateStock(tap.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                      </div>

                      <button
                        onClick={() => {
                          if (!onDeleteTap) return;
                          if (!confirm(`Delete tap "${tap.name}"? This cannot be undone.`)) return;
                          onDeleteTap(tap.id);
                        }}
                        className="ml-2 px-3 py-1 text-xs rounded bg-red-700/20 text-red-400 hover:bg-red-700/30 transition-colors"
                      >
                        Remove
                      </button>
                  </div>

               </div>
             );
          })}
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white">Register New Tap</h2>
                    <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Tap Identifier</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Tap 5 (Patio)"
                                required
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Beer Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Galaxy Pale"
                                required
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                value={formData.beerName}
                                onChange={e => setFormData({...formData, beerName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Type</label>
                            <select 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                value={formData.beerType}
                                onChange={e => setFormData({...formData, beerType: e.target.value as BeerType})}
                            >
                                {Object.values(BeerType).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Keg Size (L)</label>
                            <select 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                value={formData.kegSizeLiters}
                                onChange={e => setFormData({...formData, kegSizeLiters: Number(e.target.value)})}
                            >
                                <option value={30}>30 Liters</option>
                                <option value={50}>50 Liters</option>
                                <option value={100}>100 Liters</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Price / Pint</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-zinc-500 text-xs">$</span>
                                <input 
                                    type="number" 
                                    step="0.10"
                                    placeholder="0.00"
                                    required
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                    value={formData.pricePerPint}
                                    onChange={e => setFormData({...formData, pricePerPint: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Cost / Keg</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-zinc-500 text-xs">$</span>
                                <input 
                                    type="number" 
                                    step="1"
                                    placeholder="0.00"
                                    required
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                    value={formData.costPerKeg}
                                    onChange={e => setFormData({...formData, costPerKeg: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Initial Spares</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                                value={formData.spareKegs}
                                onChange={e => setFormData({...formData, spareKegs: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button type="submit" className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" />
                            Initialize Tap System
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};