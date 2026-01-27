import React from 'react';
import { BarChart3 } from 'lucide-react';

interface Props {
  history?: any[];
}

const AnalyticsDashboard: React.FC<Props> = ({ history = [] }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="glass-panel rounded-2xl p-16 text-center border border-white/10">
        <div className="w-20 h-20 bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <BarChart3 size={40} />
        </div>
        <h3 className="text-3xl font-display text-white mb-3 font-bold">Usage Analytics</h3>
        <p className="text-white/60 text-base">Coming soon - detailed analytics and usage reports will be available here.</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
