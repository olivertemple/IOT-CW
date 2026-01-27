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
    <div className="glass-panel rounded-[30px] p-6 relative hover:-translate-y-1 transition-all duration-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tap.tapId);
        }}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white border border-stone flex items-center justify-center text-ember hover:text-ink transition-colors z-10"
        title="Disconnect tap"
      >
        <X size={16} />
      </button>

      <div onClick={onSelect} className="cursor-pointer space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center icon-ring">
              <Beer size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">{tap.tapId}</h3>
              <span className={`text-xs uppercase tracking-[0.2em] font-semibold ${
                tap.isConnected ? 'text-pine' : 'text-ember'
              }`}>
                {tap.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            !tap.isConnected ? 'bg-ember' :
              isPouring ? 'bg-pine pulse-dot' : 'bg-ink/20'
          }`}></div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-ink/50">Current Pour</div>
          <div className="text-2xl font-display text-ink mt-2">{tapData.beer_name || 'No Keg'}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-2xl border border-stone py-4">
            <div className="text-xl font-semibold text-ink">{Math.round(pct)}%</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink/50">Level</div>
            <div className="mt-3 h-1.5 bg-drift rounded-full mx-5 overflow-hidden">
              <div
                className={`${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-ember' : 'bg-pine'} h-full rounded-full`}
                style={{ width: `${Math.min(100, pct)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone py-4">
            <div className="text-xl font-semibold text-ink">{temp.toFixed(1)}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink/50">°C</div>
            <div className={`text-xs font-semibold mt-3 ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-ember' : 'text-pine'}`}>
              {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'Warm' : 'Cool'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone py-4">
            <div className="text-xl font-semibold text-ink">{(kegData.flow || 0).toFixed(1)}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink/50">LPM</div>
            <div className={`text-xs font-semibold mt-3 ${isPouring ? 'text-pine' : 'text-ink/40'}`}>
              {isPouring ? 'Pouring' : 'Idle'}
            </div>
          </div>
        </div>

        <div className="pt-2 text-sm text-pine font-semibold">View Details →</div>
      </div>
    </div>
  );
};

export default TapCard;
