import React from 'react';
import { Beer, BarChart3, Package, ThermometerSun} from 'lucide-react';
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
  const remainingLitres = (kegState?.volume_remaining_ml || 0) / 1000;
  const isPouring = tapState?.view === 'POURING';
  const isConnected = allTaps.find(t => t.tapId === selectedTap)?.isConnected || false;
  console.log('DashboardView Render', { selectedTap, tapState, kegState });
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
      <aside className="space-y-6">
        <div className="glass-panel rounded-[24px] p-5 space-y-4">
          <div className="text-xs uppercase tracking-[0.3em] text-ink/50">Service Snapshot</div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-stone bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ink/10 text flex items-center justify-center">
                  <Beer size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink/50">Now Serving</div>
                  <div className="text-lg font-display text-ink">{tapState?.beer_name || 'No Keg'}</div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isPouring ? 'bg-pine/10 border-pine/30' : 'bg-white border-stone'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPouring ? 'bg-pine text' : 'bg-ink/10 text-ink'}`}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink/50">Flow Rate</div>
                  <div className="text-2xl font-semibold text-ink">{flow.toFixed(1)} LPM</div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-ember/10 border-ember/30' : 'bg-white border-stone'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-ember text' : 'bg-ink/10 text-ink'}`}>
                  <ThermometerSun size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink/50">Temperature</div>
                  <div className="text-2xl font-semibold text-ink">{temp.toFixed(1)}°C</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ink/10 text flex items-center justify-center">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink/50">Active Keg</div>
                    <div className="text-2xl font-semibold text-ink font-mono">{kegState?.id || '---'}</div>
                    <div className="text-sm text-ink/60 mt-1">
                      {kegState ? (
                        <>
                          <span className="font-semibold">{remainingLitres.toFixed(1)} L</span>
                          <span className="ml-2">({Math.round(pct)}%)</span>
                        </>
                      ) : (
                        '---'
                      )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="glass-panel rounded-[28px] p-6 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-ink/50">System Status</div>
            <div className="text-2xl font-display text-ink mt-2">{isConnected ? 'Stable & Pouring' : 'Awaiting Connection'}</div>
          </div>
          <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${isConnected ? 'bg-pine/10 text-pine border-pine/30' : 'bg-ember/10 text-ember border-ember/30'}`}>
            {isConnected ? 'All Systems Normal' : 'Check Connection'}
          </div>
        </div>

        <LiveTapView
          tapState={tapState}
          kegState={kegState}
          isConnected={isConnected}
          tapId={selectedTap}
        />
      </div>
    </div>
  );
};

export default DashboardView;
