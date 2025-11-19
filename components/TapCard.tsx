import React from 'react';
import { Tap } from '../types';
import { Droplets, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface TapCardProps {
  tap: Tap;
  onClick: () => void;
}

export const TapCard: React.FC<TapCardProps> = ({ tap, onClick }) => {
  const percentage = (tap.currentLevelLiters / tap.kegSizeLiters) * 100;
  const isLow = percentage < 15;
  const isEmpty = tap.status === 'empty';
  const isChanging = tap.status === 'changing';

  return (
    <button 
      onClick={onClick}
      className="group relative w-full text-left bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300 p-6 flex flex-col h-full"
    >
      {/* Top Row: Identity */}
      <div className="flex justify-between items-start mb-6 w-full">
        <div>
           <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">{tap.beerType}</span>
           <h3 className="text-lg font-medium text-white mt-1 group-hover:text-zinc-200 transition-colors">{tap.beerName}</h3>
           <p className="text-xs text-zinc-500">{tap.name}</p>
        </div>
        <StatusIndicator status={tap.status} isFlowing={tap.isFlowing} />
      </div>

      {/* Middle: Metrics */}
      <div className="flex-1 flex flex-col justify-end mb-6">
        <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-light tracking-tighter ${isLow ? 'text-red-400' : 'text-white'}`}>
                {Math.round(percentage)}
            </span>
            <span className="text-sm text-zinc-500">%</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1 font-mono">
            {tap.currentLevelLiters.toFixed(1)}L / {tap.kegSizeLiters}L
        </div>
      </div>

      {/* Bottom: Visuals */}
      <div className="w-full space-y-3">
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-500' : 'bg-white'} ${isChanging ? 'animate-pulse' : ''}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${tap.spareKegs > 0 ? 'bg-zinc-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{tap.spareKegs} Spares</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
};

const StatusIndicator = ({ status, isFlowing }: { status: string, isFlowing: boolean }) => {
    if (status === 'changing') {
        return <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Swapping</span>
    }
    if (status === 'empty') {
        return <span className="flex items-center gap-1.5 text-[10px] font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Empty</span>
    }
    if (isFlowing) {
        return <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><Droplets className="w-3 h-3" /> Pouring</span>
    }
    return <div className="w-2 h-2 rounded-full bg-zinc-700" />;
}