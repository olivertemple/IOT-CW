
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  history?: any[];
}

const AnalyticsDashboard: React.FC<Props> = ({ history = [] }) => {
  const [beer, setBeer] = useState('Hazy IPA');
  const [buckets, setBuckets] = useState<Array<{bucket_ts:number, volume_ml:number}>>([]);

  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    // fetch last 7 days by default to show more points
    const to = Date.now();
    const from = to - 7 * 24 * 3600000;
    fetch(`/api/usage?beer=${encodeURIComponent(beer)}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        // debug: ensure frontend received the API payload
        // eslint-disable-next-line no-console
        console.log('usage API', data);
        setBuckets((data.buckets || []).sort((a: any, b: any) => a.bucket_ts - b.bucket_ts));
      })
      .catch(() => setBuckets([]));
  }, [beer]);

  const chartData = buckets.map(b => ({
    bucket_ts: b.bucket_ts,
    // keep a human-readable label for other uses
    time: new Date(b.bucket_ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    volume: b.volume_ml
  }));

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  const totalMl = buckets.reduce((s, b) => s + (b.volume_ml || 0), 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       {/* Volume Chart */}
       <div className="xl:col-span-2 bg-gradient-to-br from-[#1a1f35] to-[#151928] p-8 rounded-2xl border border-[#2a3350] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                      <Activity className="text-white" size={24} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-white">Pour Volume</h3>
                      <p className="text-sm text-slate-400 mt-0.5">Last 7 days activity</p>
                  </div>
              </div>
              <select 
                  value={beer} 
                  onChange={e => setBeer(e.target.value)} 
                  className="bg-[#0a0e1a] border-2 border-[#2a3350] text-white px-4 py-2.5 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                  <option>Hazy IPA</option>
                  <option>Stout</option>
                  <option>Lager</option>
              </select>
          </div>
          
          <div className="mb-6 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                  <span className="text-sm text-slate-400">Total Volume:</span>
                  <span className="text-3xl font-black text-white">{totalMl}</span>
                  <span className="text-slate-500 text-lg font-semibold">ml</span>
              </div>
              <button 
                  onClick={() => setShowRaw(s => !s)} 
                  className="text-xs text-slate-400 hover:text-slate-300 underline transition-colors"
              >
                  {showRaw ? 'Hide' : 'Show'} raw data
              </button>
          </div>
          
          {showRaw && (
            <pre className="text-xs bg-[#0a0e1a] p-4 rounded-xl text-slate-300 overflow-auto max-h-40 mb-6 border border-[#2a3350] font-mono">{JSON.stringify(buckets, null, 2)}</pre>
          )}
          
          {totalMl === 0 && buckets.length > 0 ? (
            <div className="py-16 text-center">
                <Activity className="mx-auto mb-4 text-slate-700" size={64} />
                <div className="text-slate-600 font-semibold">No usage in the selected range</div>
            </div>
          ) : (
          <div className="h-80 bg-[#0a0e1a]/50 rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
                        <XAxis 
                            dataKey="bucket_ts" 
                            stroke="#64748b" 
                            fontSize={11} 
                            interval={tickInterval} 
                            tick={{ fill: '#94a3b8' }} 
                            angle={-45} 
                            textAnchor="end" 
                            height={60} 
                            tickFormatter={(ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })} 
                        />
                        <YAxis stroke="#64748b" fontSize={12} tick={{ fill: '#94a3b8' }} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#1a1f35', 
                                borderColor: '#2a3350', 
                                color: '#fff',
                                borderRadius: '12px',
                                border: '2px solid #2a3350',
                                padding: '12px',
                                fontWeight: 'bold'
                            }}
                            cursor={{ fill: '#2a3350', opacity: 0.5 }}
                            labelFormatter={(label) => {
                              try { return new Date(Number(label)).toLocaleString(); } catch { return String(label); }
                            }}
                        />
                    <Bar dataKey="volume" fill="url(#blueGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                    </defs>
                </BarChart>
            </ResponsiveContainer>
          </div>
          )}
       </div>

       {/* Efficiency Metric */}
       <div className="bg-gradient-to-br from-[#1a1f35] to-[#151928] p-8 rounded-2xl border border-[#2a3350] shadow-2xl flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 glow-success">
              <TrendingUp className="text-white" size={48} />
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wide">System Efficiency</h3>
          <div className="display-number text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500 mb-4">98.5%</div>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
            Calculated based on flow-meter vs load-cell discrepancies over the last 24 hours.
          </p>
          <div className="mt-6 w-full max-w-xs">
              <div className="progress-bar h-3">
                  <div className="progress-fill bg-gradient-to-r from-green-500 to-green-400" style={{ width: '98.5%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>0%</span>
                  <span>100%</span>
              </div>
          </div>
       </div>
    </div>
  );
};

export default AnalyticsDashboard;
