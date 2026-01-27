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
      <div className="glass-panel rounded-[32px] p-12 text-center">
        <div className="w-16 h-16 bg-ink text-white rounded-2xl mx-auto mb-4 flex items-center justify-center floaty">
          <Activity size={32} />
        </div>
        <h3 className="text-2xl font-display text-ink mb-2">No Tap Systems Detected</h3>
        <p className="text-ink/60 text-sm">Start a tap system with <code className="bg-white px-2 py-1 rounded-md text-ink/80">node simulators/dashboard.cjs --tap=tap-01</code></p>
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
