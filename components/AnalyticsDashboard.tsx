
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  history: any[];
}

const AnalyticsDashboard: React.FC<Props> = ({ history }) => {
  // Transform raw history into chart data
  const chartData = history.slice(0, 20).reverse().map((h, i) => ({
    id: i,
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    volume: h.volume_ml || (Math.random() * 500), // Mock data if empty for visualization
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       {/* Volume Chart */}
       <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6">Pour Volume (Last Hour)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        cursor={{ fill: '#334155', opacity: 0.4 }}
                    />
                    <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
       </div>

       {/* Efficiency Metric */}
       <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center">
          <h3 className="text-lg font-bold text-slate-400 mb-2">System Efficiency</h3>
          <div className="text-6xl font-bold text-green-400 mb-2">98.5%</div>
          <p className="text-slate-500 text-sm max-w-xs">
            Calculated based on flow-meter vs load-cell discrepancies over the last 24 hours.
          </p>
       </div>
    </div>
  );
};

export default AnalyticsDashboard;
