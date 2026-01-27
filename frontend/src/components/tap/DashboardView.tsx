import React from 'react';
import { Beer, BarChart3, Package } from 'lucide-react';
import LiveTapView from '../LiveTapView';
import { UI_CONSTANTS } from '../../constants';

interface DashboardViewProps {
  allTaps: any[];
  selectedTap: string;
  tapState: any;
  kegState: any;
  onTapChange: (tapId: string) => void;
  onBackToTaps: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  allTaps,
  selectedTap,
  tapState,
  kegState,
  onTapChange,
  onBackToTaps
}) => {
  const pct = tapState?.volume_remaining_pct || 0;
  const temp = kegState?.temp || 4.0;
  const flow = kegState?.flow || 0;
  const isPouring = tapState?.view === 'POURING';
  const isConnected = allTaps.find(t => t.tapId === selectedTap)?.isConnected || false;

  return (
    <div className="space-y-6">
      {/* Tap Selector */}
      {allTaps.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Viewing:</span>
            {allTaps.map(tap => (
              <button
                key={tap.tapId}
                onClick={() => onTapChange(tap.tapId)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTap === tap.tapId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tap.tapId}
              </button>
            ))}
            <button
              onClick={onBackToTaps}
              className="ml-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all"
            >
              ← Back to All Taps
            </button>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Beer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Beer className="text-indigo-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Now Serving</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{tapState?.beer_name || 'No Keg'}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600 font-medium">{pct}% Full</span>
          </div>
        </div>

        {/* Flow Status */}
        <div className={`border rounded-2xl p-6 ${
          isPouring 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isPouring ? 'bg-green-200' : 'bg-gray-100'
            }`}>
              <BarChart3 className={isPouring ? 'text-green-700' : 'text-gray-600'} size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flow Rate</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{flow.toFixed(1)}</h3>
          <span className={`text-sm font-medium ${isPouring ? 'text-green-700' : 'text-gray-600'}`}>
            LPM {isPouring && '• Pouring'}
          </span>
        </div>

        {/* Temperature */}
        <div className={`border rounded-2xl p-6 ${
          temp > UI_CONSTANTS.HIGH_TEMP_WARNING
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-red-200' : 'bg-blue-200'
            }`}>
              <Beer className={temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-700' : 'text-blue-700'} size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temperature</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{temp.toFixed(1)}°C</h3>
          <span className={`text-sm font-medium ${
            temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-700' : 'text-blue-700'
          }`}>
            {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'Too Warm' : 'Optimal'}
          </span>
        </div>

        {/* Keg ID */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Keg</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{kegState?.id || '---'}</h3>
          <span className="text-sm text-gray-600 font-medium">Source ID</span>
        </div>
      </div>

      {/* Detailed View */}
      <LiveTapView 
        tapState={tapState} 
        kegState={kegState} 
        isConnected={isConnected}
      />
    </div>
  );
};

export default DashboardView;
