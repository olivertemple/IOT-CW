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
      {allTaps.length > 1 && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-ink/70">Viewing:</span>
            {allTaps.map(tap => (
              <button
                key={tap.tapId}
                onClick={() => onTapChange(tap.tapId)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all border ${
                  selectedTap === tap.tapId
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-stone hover:border-ink'
                }`}
              >
                {tap.tapId}
              </button>
            ))}
            <button
              onClick={onBackToTaps}
              className="ml-auto px-4 py-2 rounded-full bg-white border border-stone text-ink hover:border-ink text-sm font-semibold transition-all"
            >
              ← Back to All Taps
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-panel rounded-[28px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-ink text-white flex items-center justify-center">
              <Beer size={20} />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50">Now Serving</span>
          </div>
          <h3 className="text-xl font-display text-ink mb-2">{tapState?.beer_name || 'No Keg'}</h3>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
            <div className={`w-2 h-2 rounded-full ${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-ember' : 'bg-pine'}`}></div>
            {pct}% Full
          </div>
        </div>

        <div className={`rounded-[28px] p-6 border ${isPouring ? 'bg-pine/10 border-pine/30' : 'bg-white border-stone'} transition-all`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPouring ? 'bg-pine text-white' : 'bg-ink/10 text-ink'}`}>
              <BarChart3 size={20} />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50">Flow Rate</span>
          </div>
          <h3 className="text-3xl font-semibold text-ink mb-1">{flow.toFixed(1)}</h3>
          <span className={`text-sm font-semibold ${isPouring ? 'text-pine' : 'text-ink/50'}`}>
            LPM {isPouring && '• Pouring'}
          </span>
        </div>

        <div className={`rounded-[28px] p-6 border ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-ember/10 border-ember/30' : 'bg-white border-stone'} transition-all`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-ember text-white' : 'bg-ink/10 text-ink'}`}>
              <Beer size={20} />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50">Temperature</span>
          </div>
          <h3 className="text-3xl font-semibold text-ink mb-1">{temp.toFixed(1)}°C</h3>
          <span className={`text-sm font-semibold ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-ember' : 'text-pine'}`}>
            {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'Too Warm' : 'Optimal'}
          </span>
        </div>

        <div className="glass-panel rounded-[28px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-ink text-white flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50">Active Keg</span>
          </div>
          <h3 className="text-2xl font-semibold text-ink mb-1 font-mono">{kegState?.id || '---'}</h3>
          <span className="text-sm text-ink/60 font-semibold">Source ID</span>
        </div>
      </div>

      <LiveTapView
        tapState={tapState}
        kegState={kegState}
        isConnected={isConnected}
      />
    </div>
  );
};

export default DashboardView;
