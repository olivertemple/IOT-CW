
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  history?: any[];
}

const AnalyticsDashboard: React.FC<Props> = ({ history = [] }) => {
  const [beer, setBeer] = useState('Hazy IPA');
  const [buckets, setBuckets] = useState<Array<{bucket_ts:number, volume_ml:number}>>([]);
  const [efficiency, setEfficiency] = useState<number | null>(null);

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

  // Fetch efficiency data
  useEffect(() => {
    fetch('/api/efficiency')
      .then(r => r.json())
      .then(data => {
        if (data.efficiency !== null && data.efficiency !== undefined) {
          setEfficiency(parseFloat(data.efficiency));
        } else {
          setEfficiency(null);
        }
      })
      .catch(() => setEfficiency(null));
  }, []);

  const chartData = buckets.map(b => ({
    bucket_ts: b.bucket_ts,
    // keep a human-readable label for other uses
    time: new Date(b.bucket_ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    volume: b.volume_ml
  }));

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  const totalMl = buckets.reduce((s, b) => s + (b.volume_ml || 0), 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
       {/* Volume Chart */}
       <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Activity className="text-indigo-600" size={20} />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-gray-900">Pour Volume</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Last 7 days activity</p>
                  </div>
              </div>
              <select 
                  value={beer} 
                  onChange={e => setBeer(e.target.value)} 
                  className="bg-white border-2 border-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                  <option>Hazy IPA</option>
                  <option>Stout</option>
                  <option>Lager</option>
              </select>
          </div>
          
          <div className="mb-6 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-600 font-medium">Total Volume:</span>
                  <span className="text-3xl font-bold text-gray-900">{totalMl}</span>
                  <span className="text-gray-500 text-base font-medium">ml</span>
              </div>
              <button 
                  onClick={() => setShowRaw(s => !s)} 
                  className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                  {showRaw ? 'Hide' : 'Show'} raw data
              </button>
          </div>
          
          {showRaw && (
            <pre className="text-xs bg-gray-50 p-4 rounded-xl text-gray-700 overflow-auto max-h-40 mb-6 border border-gray-200 font-mono">{JSON.stringify(buckets, null, 2)}</pre>
          )}
          
          {totalMl === 0 && buckets.length > 0 ? (
            <div className="py-16 text-center">
                <Activity className="mx-auto mb-4 text-gray-300" size={64} />
                <div className="text-gray-600 font-medium">No usage in the selected range</div>
            </div>
          ) : (
          <div className="h-80 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="bucket_ts" 
                            stroke="#9ca3af" 
                            fontSize={11} 
                            interval={tickInterval} 
                            tick={{ fill: '#6b7280' }} 
                            angle={-45} 
                            textAnchor="end" 
                            height={60} 
                            tickFormatter={(ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })} 
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#6b7280' }} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                borderColor: '#e5e7eb', 
                                color: '#111827',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb',
                                padding: '12px',
                                fontWeight: '600'
                            }}
                            cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                            labelFormatter={(label) => {
                              try { return new Date(Number(label)).toLocaleString(); } catch { return String(label); }
                            }}
                        />
                    <Bar dataKey="volume" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
          )}
       </div>

       {/* Efficiency Metric */}
       <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="text-green-600" size={32} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">System Efficiency</h3>
          {efficiency !== null ? (
            <>
              <div className="text-7xl font-bold text-gray-900 mb-4">{efficiency.toFixed(1)}<span className="text-4xl text-gray-400">%</span></div>
              <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
                Calculated from flow-meter vs load-cell data over the last 24 hours.
              </p>
              <div className="mt-6 w-full max-w-xs">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, efficiency)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>0%</span>
                      <span>100%</span>
                  </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-gray-400 mb-4">N/A</div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Insufficient telemetry data to calculate efficiency. Needs 24 hours of pour activity.
              </p>
            </>
          )}
       </div>
    </div>
  );
};

export default AnalyticsDashboard;
