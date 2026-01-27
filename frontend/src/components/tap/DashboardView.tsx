import React from 'react';
import { Beer, BarChart3, Package, ArrowLeft } from 'lucide-react';
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
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      <aside className="space-y-6">
        <div className="glass-panel rounded-xl p-5 border border-white/10">
          <button
            onClick={onBackToTaps}
            className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to All Taps
          </button>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4 border border-white/10">
          <div className="text-xs uppercase tracking-[0.4em] text-white/50 font-bold">Live Metrics</div>
          <div className="grid gap-3">
            <div className="rounded-xl border border-white/20 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 flex items-center justify-center">
                  <Beer size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Now Serving</div>
                  <div className="text-lg font-display text-white font-bold mt-1">{tapState?.beer_name || 'No Keg'}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-4 transition-all ${isPouring ? 'bg-accent-green/20 border-accent-green/40 glow-green' : 'bg-white/5 border-white/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPouring ? 'bg-accent-green text-dark-950' : 'bg-white/10 text-white'}`}>
                  <BarChart3 size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Flow Rate</div>
                  <div className="text-2xl font-bold text-white mt-1">{flow.toFixed(1)} <span className="text-base">LPM</span></div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-4 transition-all ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-accent-red/20 border-accent-red/40' : 'bg-white/5 border-white/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-accent-red text-white' : 'bg-white/10 text-white'}`}>
                  <Beer size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Temperature</div>
                  <div className="text-2xl font-bold text-white mt-1">{temp.toFixed(1)}<span className="text-base">°C</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/5 p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 text-white flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold">Active Keg</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{kegState?.id || '---'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="glass-panel rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 border border-white/10">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-white/50 font-bold">System Status</div>
            <div className="text-3xl font-display text-white mt-2 font-bold">{isConnected ? 'Operational' : 'Disconnected'}</div>
          </div>
          <div className={`px-5 py-3 rounded-lg border text-sm font-bold ${isConnected ? 'bg-accent-green/20 text-accent-green border-accent-green/40' : 'bg-accent-red/20 text-accent-red border-accent-red/40'}`}>
            {isConnected ? 'ALL SYSTEMS GO' : 'CHECK CONNECTION'}
          </div>
        </div>

        <LiveTapView
          tapState={tapState}
          kegState={kegState}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default DashboardView;
