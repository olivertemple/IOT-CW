
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, AlertTriangle } from 'lucide-react';

interface Props {
  tapState: any;
  kegState: any;
}

const LiveTapView: React.FC<Props> = ({ tapState, kegState }) => {
  const isPouring = tapState?.view === 'POURING';
  const isSwap = tapState?.view === 'SWAP';
  const pct = tapState?.volume_remaining_pct || 0;
  const temp = kegState?.temp || 4.0;
  const flow = kegState?.flow || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Main Visual - The Keg/Glass */}
      <div className="lg:col-span-1 bg-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="relative w-40 h-80 border-4 border-slate-700 rounded-b-3xl bg-slate-800/50 backdrop-blur-sm overflow-hidden z-10">
            {/* Liquid */}
            <motion.div 
                className="absolute bottom-0 left-0 w-full bg-amber-500"
                initial={{ height: '0%' }}
                animate={{ height: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            >
                {/* Bubbles Animation */}
                {isPouring && (
                    <div className="absolute inset-0 w-full h-full opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse" />
                )}
            </motion.div>
            
            {/* Glass Glare */}
            <div className="absolute top-0 right-4 w-2 h-full bg-white/10 rounded-full blur-sm"></div>
        </div>
        
        <h2 className="mt-6 text-2xl font-bold text-white">{tapState?.beer_name || 'No Keg Connected'}</h2>
        <div className="text-slate-400 font-mono mt-1">{pct}% Remaining</div>

        {isSwap && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex items-center justify-center flex-col"
            >
                <AlertTriangle className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-white">SWAPPING KEG</h3>
                <p className="text-slate-400">Please Wait...</p>
            </motion.div>
        )}
      </div>

      {/* Stats Panel */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
        
        {/* Status Card */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">System Status</div>
                <div className={`text-2xl font-bold ${isPouring ? 'text-green-400' : 'text-slate-200'}`}>
                    {isPouring ? 'POURING ACTIVE' : 'SYSTEM IDLE'}
                </div>
            </div>
            <div className={`p-4 rounded-full ${isPouring ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                <Activity size={32} />
            </div>
        </div>

        {/* Active Keg Card */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Active Source</div>
                <div className="text-2xl font-bold text-blue-400">
                    {kegState?.id || '---'}
                </div>
            </div>
            <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
                <Droplets size={32} />
            </div>
        </div>

        {/* Flow Rate */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Activity size={18} />
                <span className="text-sm font-semibold">LIVE FLOW RATE</span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-5xl font-mono font-bold text-white">{flow.toFixed(1)}</span>
                <span className="text-slate-500 mb-1">LPM</span>
            </div>
            <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-green-500"
                    animate={{ width: `${Math.min((flow / 5) * 100, 100)}%` }}
                />
            </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Thermometer size={18} />
                <span className="text-sm font-semibold">BEER TEMP</span>
            </div>
            <div className="flex items-end gap-2">
                <span className={`text-5xl font-mono font-bold ${temp > 6 ? 'text-red-400' : 'text-white'}`}>{temp.toFixed(1)}</span>
                <span className="text-slate-500 mb-1">°C</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-4">
                <span>Optimal: 3-5°C</span>
                <span className={temp > 6 ? "text-red-500 font-bold" : "text-green-500"}>
                    {temp > 6 ? 'WARNING' : 'GOOD'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTapView;
