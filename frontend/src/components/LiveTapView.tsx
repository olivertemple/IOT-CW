import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, ThermometerSun, Droplet } from 'lucide-react';
import { UI_CONSTANTS } from '../constants';
import FlowChart from './FlowChart';

interface Props {
  tapState: any;
  kegState: any;
  isConnected?: boolean;
}

const LiveTapView: React.FC<Props> = ({ tapState, kegState, isConnected = true }) => {
  const isPouring = tapState?.view === 'POURING';
  const isSwap = tapState?.view === 'SWAP';
  const pct = tapState?.volume_remaining_pct || 0;
  const temp = kegState?.temp || 4.0;
  const flow = kegState?.flow || 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[480px_minmax(420px,1fr)] gap-6">
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border ${
            isConnected ? 'bg-accent-green/20 text-accent-green border-accent-green/40' : 'bg-accent-red/20 text-accent-red border-accent-red/40'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accent-green pulse-dot' : 'bg-accent-red'}`}></div>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <div className="text-xs uppercase tracking-[0.4em] text-white/40 font-bold">Live Feed</div>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-full">
                <FlowChart flow={flow} height={180} maxPoints={80} maxFlow={UI_CONSTANTS.MAX_FLOW_RATE_LPM} />
              </div>

              <div className="mt-6 text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-display text-white font-bold">
                  {flow.toFixed(1)}
                  <span className="text-base text-white/40"> L/min</span>
                </div>
                <div className="text-xs uppercase tracking-[0.4em] text-white/50 mt-2 font-semibold">Flow Rate</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3 font-bold">Current Beer</div>
              <h2 className="text-4xl font-display text-white font-bold">
                {tapState?.beer_name || 'No Keg Connected'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="p-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50 mb-3 font-semibold">
                  <ThermometerSun size={16} /> Temperature
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-accent-red' : 'text-white'}`}>{temp.toFixed(1)}</span>
                  <span className="text-xl text-white/40 font-bold">°C</span>
                </div>
                <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                  temp > UI_CONSTANTS.HIGH_TEMP_WARNING
                    ? 'bg-accent-red/20 text-accent-red border border-accent-red/40'
                    : 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                }`}>
                  {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'HIGH' : 'OPTIMAL'}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50 mb-3 font-semibold">
                  <Droplet size={16} /> Flow Rate
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold ${isPouring ? 'text-accent-green' : 'text-white/40'}`}>
                    {flow.toFixed(1)}
                  </span>
                  <span className="text-xl text-white/40 font-bold">L/min</span>
                </div>
                <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                  isPouring
                    ? 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                    : 'bg-white/10 text-white/60 border border-white/20'
                }`}>
                  {isPouring ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-2 font-semibold">
                  <span>Temperature Range</span>
                  <span>{UI_CONSTANTS.OPTIMAL_TEMP_MIN}-{UI_CONSTANTS.OPTIMAL_TEMP_MAX}°C</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-accent-red' : 'bg-accent-green'}`}
                    animate={{ width: `${Math.min((temp / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/60 mb-2 font-semibold">
                  <span>Flow Capacity</span>
                  <span>Max {UI_CONSTANTS.MAX_FLOW_RATE_LPM} LPM</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-gold"
                    animate={{ width: `${Math.min((flow / UI_CONSTANTS.MAX_FLOW_RATE_LPM) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {isSwap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-dark-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl"
          >
            <div className="w-16 h-16 border-4 border-t-accent-gold border-r-accent-gold border-b-white/20 border-l-white/20 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-display text-white mb-2 font-bold">Keg Swap in Progress</h3>
            <p className="text-white/60">Please wait while the system updates...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LiveTapView;
