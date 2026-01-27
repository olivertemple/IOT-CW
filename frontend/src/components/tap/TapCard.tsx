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
    <div className="glass-panel rounded-2xl p-6 relative hover:scale-[1.02] transition-all duration-200 border border-white/10 group">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tap.tapId);
        }}
        className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-accent-red hover:bg-accent-red/20 transition-colors z-10"
        title="Disconnect tap"
      >
        <X size={16} />
      </button>

      <div onClick={onSelect} className="cursor-pointer space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 flex items-center justify-center shadow-lg">
              <Beer size={26} className="fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{tap.tapId}</h3>
              <span className={`text-xs uppercase tracking-[0.25em] font-bold ${
                tap.isConnected ? 'text-accent-green' : 'text-accent-red'
              }`}>
                {tap.isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full ${
            !tap.isConnected ? 'bg-accent-red' :
              isPouring ? 'bg-accent-green pulse-dot' : 'bg-white/30'
          }`}></div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50 font-semibold">Now Serving</div>
          <div className="text-2xl font-display text-white mt-2 font-bold">{tapData.beer_name || 'No Keg'}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-xl border border-white/10 py-4 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-white">{Math.round(pct)}%</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">Level</div>
            <div className="mt-3 h-2 bg-white/10 rounded-full mx-4 overflow-hidden">
              <div
                className={`${pct < UI_CONSTANTS.LOW_KEG_THRESHOLD_PCT ? 'bg-accent-red' : 'bg-accent-green'} h-full rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, pct)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 py-4 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-white">{temp.toFixed(1)}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">°C</div>
            <div className={`text-xs font-bold mt-3 ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-accent-red' : 'text-accent-green'}`}>
              {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'WARM' : 'COOL'}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 py-4 hover:bg-white/10 transition-colors">
            <div className="text-2xl font-bold text-white">{(kegData.flow || 0).toFixed(1)}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">LPM</div>
            <div className={`text-xs font-bold mt-3 ${isPouring ? 'text-accent-green' : 'text-white/40'}`}>
              {isPouring ? 'POURING' : 'IDLE'}
            </div>
          </div>
        </div>

        <div className="pt-3 text-sm text-accent-gold font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
          View Details
          <span className="text-lg">→</span>
        </div>
      </div>
    </div>
  );
};

export default TapCard;
