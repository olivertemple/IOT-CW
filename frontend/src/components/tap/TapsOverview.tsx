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
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Activity size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Tap Systems Detected</h3>
        <p className="text-gray-600">Start a tap system with <code className="bg-gray-100 px-2 py-1 rounded text-sm">node simulators/dashboard.cjs --tap=tap-01</code></p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
