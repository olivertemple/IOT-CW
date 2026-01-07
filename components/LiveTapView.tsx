
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, AlertTriangle, Zap } from 'lucide-react';
import { UI_CONSTANTS } from '../constants';

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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
      {/* Main Visual - The Keg Display */}
      <div className="xl:col-span-1 bg-gradient-to-br from-[#1a1f35] to-[#151928] rounded-3xl border border-[#2a3350] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Keg visualization */}
          <div className="relative w-48 h-96 border-4 border-[#2a3350] rounded-b-[3rem] bg-[#0a0e1a]/80 backdrop-blur-sm overflow-hidden shadow-2xl">
              {/* Liquid */}
              <motion.div 
                  className={`absolute bottom-0 left-0 w-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-gradient-to-t from-red-500 to-orange-500' : 'bg-gradient-to-t from-amber-600 to-amber-400'}`}
                  initial={{ height: '0%' }}
                  animate={{ height: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 25 }}
              >
                  {/* Bubbles Animation */}
                  {isPouring && (
                      <div className="absolute inset-0 w-full h-full">
                          <motion.div 
                              className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/40 rounded-full"
                              animate={{ y: [-20, -200], opacity: [1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div 
                              className="absolute bottom-0 left-1/2 w-3 h-3 bg-white/30 rounded-full"
                              animate={{ y: [-20, -200], opacity: [1, 0] }}
                              transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                          />
                          <motion.div 
                              className="absolute bottom-0 left-3/4 w-2 h-2 bg-white/40 rounded-full"
                              animate={{ y: [-20, -200], opacity: [1, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
                          />
                      </div>
                  )}
              </motion.div>
              
              {/* Glass Glare */}
              <div className="absolute top-0 right-8 w-3 h-full bg-gradient-to-r from-white/20 to-transparent rounded-full blur-sm"></div>
          </div>
          
          <div className="mt-8 text-center">
              <h2 className="text-3xl font-black text-white mb-2">{tapState?.beer_name || 'No Keg Connected'}</h2>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#1a1f35] rounded-full border border-[#2a3350]">
                  <div className={`w-3 h-3 rounded-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-500 glow-danger' : 'bg-amber-500 glow-warning'}`}></div>
                  <span className="font-mono font-bold text-2xl text-white">{pct}%</span>
                  <span className="text-slate-400 text-sm">Remaining</span>
              </div>
          </div>
        </div>

        {isSwap && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-[#0a0e1a]/95 backdrop-blur-md z-20 flex items-center justify-center flex-col"
            >
                <AlertTriangle className="text-red-500 w-20 h-20 mb-6 animate-bounce" />
                <h3 className="text-2xl font-black text-white mb-2">SWAPPING KEG</h3>
                <p className="text-slate-400">Please Wait...</p>
            </motion.div>
        )}
      </div>

      {/* Stats Panel */}
      <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
        
        {/* Status Card */}
        <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">System Status</div>
                    <div className={`text-3xl font-black mb-1 ${isPouring ? 'gradient-text' : 'text-white'}`}>
                        {isPouring ? 'POURING' : 'IDLE'}
                    </div>
                    <div className="text-sm text-slate-500">
                        {isPouring ? 'Dispensing in progress' : 'Ready to serve'}
                    </div>
                </div>
                <div className={`p-5 rounded-2xl ${isPouring ? 'bg-gradient-to-br from-green-500 to-green-600 glow-success' : 'bg-[#151928]'}`}>
                    {isPouring ? <Zap className="text-white" size={36} /> : <Activity className="text-slate-500" size={36} />}
                </div>
            </div>
        </div>

        {/* Active Keg Card */}
        <div className="stat-card hover-lift">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Active Keg</div>
                    <div className="text-3xl font-black text-white mb-1">
                        {kegState?.id || '---'}
                    </div>
                    <div className="text-sm text-slate-500">
                        Connected source
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 glow-accent">
                    <Droplets className="text-white" size={36} />
                </div>
            </div>
        </div>

        {/* Flow Rate - Full Width */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#1a1f35] to-[#151928] p-8 rounded-2xl border border-[#2a3350] shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Activity size={22} />
                    <span className="text-sm font-bold uppercase tracking-wide">Live Flow Rate</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${flow > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                    {flow > 0 ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>
            <div className="flex items-end gap-3 mb-6">
                <span className="display-number text-white">{flow.toFixed(1)}</span>
                <span className="text-3xl text-slate-500 mb-3 font-bold">LPM</span>
            </div>
            <div className="progress-bar h-3">
                <motion.div 
                    className="progress-fill bg-gradient-to-r from-green-500 to-green-400"
                    animate={{ width: `${Math.min((flow / UI_CONSTANTS.MAX_FLOW_RATE_LPM) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0 LPM</span>
                <span>Max: {UI_CONSTANTS.MAX_FLOW_RATE_LPM} LPM</span>
            </div>
        </div>

        {/* Temperature - Full Width */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#1a1f35] to-[#151928] p-8 rounded-2xl border border-[#2a3350] shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Thermometer size={22} />
                    <span className="text-sm font-bold uppercase tracking-wide">Beer Temperature</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-bold ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-red-500/20 text-red-400 glow-danger' : 'bg-green-500/20 text-green-400'}`}>
                    {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'WARNING' : 'OPTIMAL'}
                </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
                <span className={`display-number ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-400' : 'text-white'}`}>{temp.toFixed(1)}</span>
                <span className="text-3xl text-slate-500 mb-3 font-bold">°C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Optimal Range: {UI_CONSTANTS.OPTIMAL_TEMP_MIN}-{UI_CONSTANTS.OPTIMAL_TEMP_MAX}°C</span>
                {temp > UI_CONSTANTS.HIGH_TEMP_WARNING && <span className="text-red-400 font-bold flex items-center gap-2"><AlertTriangle size={16} /> Too Warm</span>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTapView;
