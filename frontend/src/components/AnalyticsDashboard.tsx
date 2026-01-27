import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface Props {
  history?: any[];
}

const AnalyticsDashboard: React.FC<Props> = ({ history = [] }) => {
  const [beer, setBeer] = useState('');
  const [beerList, setBeerList] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<Array<{ bucket_ts: number, volume_ml: number }>>([]);

  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetch('/api/beers')
      .then(r => r.json())
      .then(data => {
        const beers = data.beers || [];
        setBeerList(beers);
        if (beers.length > 0 && !beer) {
          setBeer(beers[0]);
        }
      })
      .catch(() => setBeerList([]));
  }, []);

  useEffect(() => {
    if (!beer) return;
    const to = Date.now();
    const from = to - 7 * 24 * 3600000;
    fetch(`/api/usage?beer=${encodeURIComponent(beer)}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        // eslint-disable-next-line no-console
        console.log('usage API', data);
        setBuckets((data.buckets || []).sort((a: any, b: any) => a.bucket_ts - b.bucket_ts));
      })
      .catch(() => setBuckets([]));
  }, [beer]);

  const chartData = buckets.map(b => ({
    bucket_ts: b.bucket_ts,
    time: new Date(b.bucket_ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    volume: b.volume_ml
  }));

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));
  const totalMl = buckets.reduce((s, b) => s + (b.volume_ml || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="glass-panel rounded-[32px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink text-white rounded-2xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-xl font-display text-ink">Pour Volume</h3>
              <p className="text-sm text-ink/60 mt-0.5">Last 7 days activity</p>
            </div>
          </div>
          <select
            value={beer}
            onChange={e => setBeer(e.target.value)}
            className="bg-white border border-stone text-ink px-4 py-2 rounded-full font-semibold text-sm focus:ring-2 focus:ring-pine/40 outline-none transition-all"
          >
            {beerList.length === 0 && <option value="">No beers available</option>}
            {beerList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-ink/60 font-semibold">Total Volume:</span>
            <span className="text-3xl font-display text-ink">{totalMl}</span>
            <span className="text-ink/50 text-base font-semibold">ml</span>
          </div>
          <button
            onClick={() => setShowRaw(s => !s)}
            className="text-xs text-ink/50 hover:text-ink underline transition-colors"
          >
            {showRaw ? 'Hide' : 'Show'} raw data
          </button>
        </div>

        {showRaw && (
          <pre className="text-xs bg-white p-4 rounded-2xl text-ink/70 overflow-auto max-h-40 mb-6 border border-stone font-mono">{JSON.stringify(buckets, null, 2)}</pre>
        )}

        {totalMl === 0 && buckets.length > 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto mb-4 text-ink/20" size={64} />
            <div className="text-ink/60 font-semibold">No usage in the selected range</div>
          </div>
        ) : (
          <div className="h-80 bg-white rounded-2xl p-4 border border-stone">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d6" />
                <XAxis
                  dataKey="bucket_ts"
                  stroke="#9a9183"
                  fontSize={11}
                  interval={tickInterval}
                  tick={{ fill: '#7b7265' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
                />
                <YAxis stroke="#9a9183" fontSize={12} tick={{ fill: '#7b7265' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e7e0d6',
                    color: '#1f1c18',
                    borderRadius: '16px',
                    border: '1px solid #e7e0d6',
                    padding: '12px',
                    fontWeight: '600'
                  }}
                  cursor={{ fill: '#f3efe7', opacity: 0.6 }}
                  labelFormatter={(label) => {
                    try { return new Date(Number(label)).toLocaleString(); } catch { return String(label); }
                  }}
                />
                <Bar dataKey="volume" fill="#2f6f64" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
