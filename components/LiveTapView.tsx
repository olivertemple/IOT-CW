
import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Thermometer, Beer, TrendingDown, Clock } from 'lucide-react';
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Large Keg Visualization */}
      <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        
        <div className="relative flex items-center justify-center gap-16">
          
          {/* Keg Visual */}
          <div className="relative">
            <div className="w-64 h-[500px] border-8 border-slate-700 rounded-b-[4rem] bg-slate-950/80 backdrop-blur-sm overflow-hidden shadow-2xl relative">
              {/* Liquid */}
              <motion.div 
                className={`absolute bottom-0 left-0 w-full ${
                  pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT 
                    ? 'bg-gradient-to-t from-red-600 via-red-500 to-orange-500' 
                    : 'bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-400'
                }`}
                initial={{ height: '0%' }}
                animate={{ height: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 40, damping: 20 }}
              >
                {/* Foam/Bubbles on top */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-yellow-100/30 to-transparent blur-sm"></div>
                
                {/* Pouring animation */}
                {isPouring && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-4 h-4 bg-white/40 rounded-full"
                        style={{ left: `${20 + i * 15}%` }}
                        animate={{
                          y: [-30, -400],
                          opacity: [1, 0],
                          scale: [1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.div>
              
              {/* Glass highlights */}
              <div className="absolute top-0 right-12 w-8 h-full bg-gradient-to-r from-white/20 to-transparent rounded-full blur-md"></div>
              <div className="absolute top-0 left-12 w-4 h-full bg-gradient-to-r from-white/10 to-transparent rounded-full blur-sm"></div>
            </div>
            
            {/* Percentage display below keg */}
            <div className="mt-8 text-center">
              <div className="text-8xl font-black text-white mb-2">{pct}<span className="text-5xl text-slate-500">%</span></div>
              <div className="text-slate-400 font-semibold uppercase tracking-wide">Remaining</div>
              
              {pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 border-2 border-red-500/40 rounded-full"
                >
                  <TrendingDown className="text-red-400" size={20} />
                  <span className="text-red-400 font-bold">LOW LEVEL</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats Column */}
          <div className="space-y-8">
            {/* Beer Name */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Beer className="text-amber-500" size={28} />
                <span className="text-sm uppercase tracking-wider text-slate-500 font-bold">Current Beer</span>
              </div>
              <h2 className="text-5xl font-black text-white leading-tight">
                {tapState?.beer_name || 'No Keg Connected'}
              </h2>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6 pt-6 border-t-2 border-slate-800">
              
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Thermometer size={20} />
                    <span className="text-sm font-bold uppercase tracking-wide">Temperature</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'HIGH' : 'GOOD'}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-400' : 'text-white'
                  }`}>{temp.toFixed(1)}</span>
                  <span className="text-3xl text-slate-500 font-bold">°C</span>
                </div>
                <div className="mt-2 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      temp > UI_CONSTANTS.HIGH_TEMP_WARNING 
                        ? 'bg-gradient-to-r from-red-600 to-orange-500' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                    }`}
                    animate={{ 
                      width: `${Math.min((temp / 10) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Flow Rate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Droplets size={20} />
                    <span className="text-sm font-bold uppercase tracking-wide">Flow Rate</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isPouring 
                      ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' 
                      : 'bg-slate-700 text-slate-500'
                  }`}>
                    {isPouring ? 'ACTIVE' : 'IDLE'}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black ${isPouring ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {flow.toFixed(1)}
                  </span>
                  <span className="text-3xl text-slate-500 font-bold">L/min</span>
                </div>
                <div className="mt-2 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-600 to-green-500"
                    animate={{ 
                      width: `${Math.min((flow / UI_CONSTANTS.MAX_FLOW_RATE_LPM) * 100, 100)}%` 
                    }}
                    transition={{ type: 'spring', stiffness: 50 }}
                  />
                </div>
              </div>

              {/* Estimated Time */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock size={18} />
                  <span className="text-xs font-bold uppercase tracking-wide">Est. Depletion</span>
                </div>
                <div className="text-3xl font-black text-white">
                  {pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'Today' : pct < 50 ? '2-3 Days' : '5+ Days'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Swap Overlay */}
        {isSwap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-8 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent rounded-full mb-8"
            ></motion.div>
            <h3 className="text-4xl font-black text-white mb-3">KEG SWAP IN PROGRESS</h3>
            <p className="text-slate-400 text-lg">Please wait while the system updates...</p>
          </motion.div>
        )}
      </div>

      {/* System Info Card */}
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 p-8 shadow-2xl">
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-6">System Information</h3>
          
          <div className="space-y-6">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Keg ID</div>
              <div className="text-3xl font-black text-white font-mono">{kegState?.id || '---'}</div>
            </div>
            
            <div className="pt-6 border-t border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Status</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                isPouring 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isPouring ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                <span className="font-bold text-sm">
                  {isPouring ? 'DISPENSING' : 'READY'}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Location</div>
              <div className="text-lg font-bold text-white">Main Bar • Line A</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-8 shadow-2xl text-white">
          <h3 className="text-sm uppercase tracking-wider font-bold mb-4 text-blue-100">Quick Info</h3>
          <p className="text-2xl font-black mb-2">Ready to Serve</p>
          <p className="text-blue-100 text-sm leading-relaxed">
            System is operating within normal parameters. Temperature and pressure levels are optimal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveTapView;
