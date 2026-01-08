import React from 'react';
import { Beer, X } from 'lucide-react';
import { UI_CONSTANTS } from '../../constants';

interface TapCardProps {
  tap: any;
  onSelect: () => void;
  onDelete: (tapId: string) => void;
}

const TapCard: React.FC<TapCardProps> = ({ tap, onSelect, onDelete }) => {
  const tapData = tap.tap || {};
  const kegData = tap.activeKeg || {};
  const pct = tapData.volume_remaining_pct || 0;
  const isPouring = tapData.view === 'POURING';
  const temp = kegData.temp || 4.0;
  
  return (
    <div className="bg-white border-2 border-gray-200 hover:border-indigo-400 rounded-2xl p-6 transition-all hover:shadow-lg relative">
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tap.tapId);
        }}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-600 transition-colors z-10"
        title="Disconnect tap"
      >
        <X size={16} />
      </button>
      
      {/* Tap Card Content (clickable) */}
      <div onClick={onSelect} className="cursor-pointer">
        {/* Tap Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Beer size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{tap.tapId}</h3>
              <span className={`text-xs uppercase tracking-wide font-semibold ${
                tap.isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {tap.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            !tap.isConnected ? 'bg-red-500' :
            isPouring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          }`}></div>
        </div>

        {/* Beer Info */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Current Beer</div>
          <div className="text-xl font-bold text-gray-900">{tapData.beer_name || 'No Keg'}</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Volume */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(pct)}%</div>
            <div className="text-xs text-gray-500">Level</div>
            <div className={`w-full h-1 rounded-full mt-2 ${
              pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-200' : 'bg-green-200'
            }`}>
              <div 
                className={`h-full rounded-full ${
                  pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              ></div>
            </div>
          </div>

          {/* Temperature */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{temp.toFixed(1)}</div>
            <div className="text-xs text-gray-500">°C</div>
            <div className={`text-xs font-semibold mt-2 ${
              temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-red-600' : 'text-blue-600'
            }`}>
              {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'Warm' : 'Cool'}
            </div>
          </div>

          {/* Flow */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{(kegData.flow || 0).toFixed(1)}</div>
            <div className="text-xs text-gray-500">LPM</div>
            <div className={`text-xs font-semibold mt-2 ${
              isPouring ? 'text-green-600' : 'text-gray-400'
            }`}>
              {isPouring ? 'Pouring' : 'Idle'}
            </div>
          </div>
        </div>

        {/* Click indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <span className="text-sm text-indigo-600 font-medium">Click for details →</span>
        </div>
      </div>
    </div>
  );
};

export default TapCard;
