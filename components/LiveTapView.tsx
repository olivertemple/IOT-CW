
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle } from 'lucide-react';
import { UI_CONSTANTS } from '../constants';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Keg Visualization */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-8">
        {/* Connection Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
            isConnected 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        
        <div className="flex items-start justify-between gap-12">
          
          {/* Keg Visual */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-48 h-96 border-4 border-gray-300 rounded-b-[3rem] bg-gray-50 overflow-hidden relative">
                {/* Liquid */}
                <motion.div 
                  className={`absolute bottom-0 left-0 w-full ${
                    pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT 
                      ? 'bg-red-400' 
                      : 'bg-yellow-400'
                  }`}
                  initial={{ height: '0%' }}
                  animate={{ height: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 40, damping: 20 }}
                >
                  {/* Subtle shine */}
                  <div className="absolute top-0 left-0 right-0 h-6 bg-white/20"></div>
                </motion.div>
                
                {/* Glass highlight */}
                <div className="absolute top-0 right-8 w-4 h-full bg-white/30"></div>
              </div>
              
              {/* Percentage below */}
              <div className="mt-6 text-center">
                <div className="text-6xl font-bold text-gray-900">{pct}<span className="text-3xl text-gray-400">%</span></div>
                <div className="text-sm text-gray-600 font-medium mt-1">Remaining</div>
                
                {pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-200 rounded-lg">
                    <AlertCircle className="text-red-600" size={16} />
                    <span className="text-red-700 text-sm font-medium">Low Level</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-8">
            {/* Beer Name */}
            <div>
              <div className="text-sm text-gray-500 font-medium mb-2">Current Beer</div>
              <h2 className="text-4xl font-bold text-gray-900">
                {tapState?.beer_name || 'No Keg Connected'}
              </h2>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              
              {/* Temperature */}
              <div>
                <div className="text-sm text-gray-500 font-medium mb-2">Temperature</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold ${
                    temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-600' : 'text-gray-900'
                  }`}>{temp.toFixed(1)}</span>
                  <span className="text-2xl text-gray-400 font-medium">°C</span>
                </div>
                <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                  temp > UI_CONSTANTS.HIGH_TEMP_WARNING 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'High' : 'Optimal'}
                </div>
              </div>

              {/* Flow Rate */}
              <div>
                <div className="text-sm text-gray-500 font-medium mb-2">Flow Rate</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold ${isPouring ? 'text-green-600' : 'text-gray-400'}`}>
                    {flow.toFixed(1)}
                  </span>
                  <span className="text-2xl text-gray-400 font-medium">L/min</span>
                </div>
                <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                  isPouring 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isPouring ? 'Active' : 'Idle'}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Temperature Range</span>
                  <span>{UI_CONSTANTS.OPTIMAL_TEMP_MIN}-{UI_CONSTANTS.OPTIMAL_TEMP_MAX}°C</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      temp > UI_CONSTANTS.HIGH_TEMP_WARNING 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                    }`}
                    animate={{ width: `${Math.min((temp / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Flow Capacity</span>
                  <span>Max {UI_CONSTANTS.MAX_FLOW_RATE_LPM} LPM</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    animate={{ width: `${Math.min((flow / UI_CONSTANTS.MAX_FLOW_RATE_LPM) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                  />
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
            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl"
          >
            <div className="w-16 h-16 border-4 border-t-indigo-600 border-r-indigo-600 border-b-gray-200 border-l-gray-200 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Keg Swap in Progress</h3>
            <p className="text-gray-600">Please wait while the system updates...</p>
          </motion.div>
        )}
      </div>

      {/* System Info */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-6">System Information</h3>
          
          <div className="space-y-6">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-2">Keg ID</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{kegState?.id || '---'}</div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 font-medium mb-2">Status</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isPouring 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isPouring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium text-sm">
                  {isPouring ? 'Dispensing' : 'Ready'}
                </span>
              </div>
            </div>


          </div>
        </div>

        {/* Quick Status */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-indigo-600" size={20} />
            <h3 className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">Quick Status</h3>
          </div>
          <p className="text-sm text-indigo-800 font-medium mb-1">Ready to Serve</p>
          <p className="text-xs text-indigo-700 leading-relaxed">
            System operating within normal parameters. All levels optimal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveTapView;
