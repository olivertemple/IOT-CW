import React from 'react';
import { Activity } from 'lucide-react';
import TapCard from './TapCard';

interface TapsOverviewProps {
  taps: any[];
  onTapSelect: (tapId: string, tapData: any, kegData: any) => void;
  onTapDelete: (tapId: string) => void;
}

const TapsOverview: React.FC<TapsOverviewProps> = ({ taps, onTapSelect, onTapDelete }) => {
  if (taps.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-16 text-center border border-white/10">
        <div className="w-20 h-20 bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 rounded-2xl mx-auto mb-6 flex items-center justify-center floaty">
          <Activity size={40} />
        </div>
        <h3 className="text-3xl font-display text-white mb-3 font-bold">No Tap Systems Detected</h3>
        <p className="text-white/60 text-base">Start a tap system with <code className="bg-white/10 px-3 py-1 rounded-lg text-accent-gold font-mono">node simulators/dashboard.cjs --tap=tap-01</code></p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {taps.map(tap => (
        <TapCard
          key={tap.tapId}
          tap={tap}
          onSelect={() => onTapSelect(tap.tapId, tap.tap, tap.activeKeg)}
          onDelete={onTapDelete}
        />
      ))}
    </div>
  );
};

export default TapsOverview;
