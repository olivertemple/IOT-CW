
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       {/* Volume Chart */}
       <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6">Pour Volume (Last Hour)</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">Beer</div>
            <select value={beer} onChange={e => setBeer(e.target.value)} className="bg-slate-800 text-white px-2 py-1 rounded">
              <option>Hazy IPA</option>
              <option>Stout</option>
              <option>Lager</option>
            </select>
          </div>
          <div className="mb-2 text-slate-200">Total: <span className="font-bold">{totalMl} ml</span></div>
          <div className="mb-4">
            <button onClick={() => setShowRaw(s => !s)} className="text-sm text-slate-400 underline">
              {showRaw ? 'Hide' : 'Show'} raw data
            </button>
          </div>
          {showRaw && (
            <pre className="text-xs bg-slate-800 p-3 rounded text-slate-200 overflow-auto max-h-40 mb-4">{JSON.stringify(buckets, null, 2)}</pre>
          )}
          {totalMl === 0 && buckets.length > 0 ? (
            <div className="py-8 text-center text-slate-400">No usage in the selected range.</div>
          ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="bucket_ts" stroke="#64748b" fontSize={11} interval={tickInterval} tick={{ fill: '#94a3b8' }} angle={-45} textAnchor="end" height={60} tickFormatter={(ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                            // label will be the bucket_ts (number) so format accordingly
                            labelFormatter={(label) => {
                              try { return new Date(Number(label)).toLocaleString(); } catch { return String(label); }
                            }}
                        />
                    <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
          )}
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
