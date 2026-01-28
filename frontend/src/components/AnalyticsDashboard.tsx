import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Package, Box } from 'lucide-react';
import csvText from '../../data/synthetic_pub_beer_sales.csv?raw';
import ridgeSvc from '../services/ridgeModel';

interface Row {
  Date: string;
  Beer: string;
  UnitsSold: number;
}


const parseCsv = (text: string) => {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 4) continue;
    const obj: any = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = parts[j];
    rows.push({ Date: obj.Date, Beer: obj.Beer, UnitsSold: Number(obj.UnitsSold) });
  }
  return rows;
};

const AnalyticsDashboard: React.FC = () => {
  const [beerList, setBeerList] = useState<string[]>(['Ale', 'Lager', 'IPA', 'Stout', 'Cider']);
  const [beer, setBeer] = useState<string>('Ale');
  const [rows, setRows] = useState<Row[]>([]);
  const [weeksBack, setWeeksBack] = useState<number>(4);
  const [perBeerRecs, setPerBeerRecs] = useState<Map<string, number> | null>(null);
  const [perBeerSource, setPerBeerSource] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    try {
      const parsed = parseCsv(csvText as string);
      setRows(parsed);
    } catch (e) {
      setRows([]);
    }
  }, []);

  const timeAdjustedRows = useMemo(() => {
    if (rows.length === 0) return [] as Row[];
    const tsList = rows.map(r => Date.parse(r.Date)).filter(ts => !isNaN(ts));
    if (tsList.length === 0) return rows;
    const latestTs = Math.max(...tsList);
    const nowTs = Date.now();
    const oneWeek = 7 * 24 * 3600 * 1000;
    const weeksDiff = Math.floor((nowTs - latestTs) / oneWeek);
    const shiftMs = (isFinite(weeksDiff) ? weeksDiff : 0) * oneWeek;
    return rows.map(r => {
      const orig = Date.parse(r.Date);
      if (isNaN(orig)) return r;
      const shifted = new Date(orig + shiftMs);
      return { ...r, Date: shifted.toISOString().slice(0, 10) };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    if (timeAdjustedRows.length === 0) return [] as { date: string; units: number }[];
    const now = new Date();
    const from = new Date(now.getTime() - weeksBack * 7 * 24 * 3600 * 1000);
    const sel = timeAdjustedRows.filter(r => r.Beer === beer).map(r => ({ date: new Date(r.Date), units: r.UnitsSold }));
    const inRange = sel.filter(s => s.date.getTime() >= from.getTime() && s.date.getTime() <= now.getTime());
    const volumeByDateMap = new Map<string, number>();
    inRange.forEach(s => {
      const key = s.date.toISOString().slice(0,10);
      volumeByDateMap.set(key, (volumeByDateMap.get(key) || 0) + s.units);
    });
    const aggregatedUsage = Array.from(volumeByDateMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, units]) => ({ date, units }));
    return aggregatedUsage;
  }, [timeAdjustedRows, beer, weeksBack]);

  const chartData = filtered.map(f => ({ bucket_ts: new Date(f.date).getTime(), time: f.date, volume: f.units }));

  const totalUnits = filtered.reduce((s, f) => s + f.units, 0);

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  const perBeerAverages = useMemo(() => {
    if (timeAdjustedRows.length === 0) return new Map<string, number>();
    const out = new Map<string, number>();
    const oneWeekMs = 7 * 24 * 3600 * 1000;
    const nowTs = Date.now();
    const fromTs = nowTs - weeksBack * oneWeekMs;
    const beers = Array.from(new Set(timeAdjustedRows.map(r => r.Beer)));
    for (const beerName of beers) {
      const rowsForBeer = timeAdjustedRows.filter(r => r.Beer === beerName && Date.parse(r.Date) >= fromTs);
      const total = rowsForBeer.reduce((s, r) => s + Number(r.UnitsSold), 0);
      out.set(beerName, total / Math.max(1, weeksBack));
    }
    return out;
  }, [timeAdjustedRows, weeksBack]);

  useEffect(() => {
    if (rows.length === 0) { setPerBeerRecs(null); return; }
    try {
      const modelOut = ridgeSvc.trainRidgeAndRecommend(rows) as any;
      const map = modelOut?.perBeerRecommendation as Map<string, number> | undefined;
      if (map && map.size > 0) {
        setPerBeerRecs(map);
        const src = new Map<string, string>();
        for (const k of map.keys()) src.set(k, 'Model');
        for (const [b] of perBeerAverages.entries()) if (!src.has(b)) src.set(b, 'Avg');
        setPerBeerSource(src);
        return;
      }
    } catch (e) {
    }
    const fallback = new Map<string, number>();
    const src = new Map<string, string>();
    for (const [b, avg] of perBeerAverages.entries()) { fallback.set(b, Math.ceil(avg)); src.set(b, 'Avg'); }
    setPerBeerRecs(fallback);
    setPerBeerSource(src);
  }, [rows, perBeerAverages]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="glass-panel rounded-[32px] p-8">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink text-white rounded-2xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-xl font-display text-ink">Usage</h3>
                <p className="text-sm text-ink/60 mt-0.5">Recent usage data</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={beer}
              onChange={e => setBeer(e.target.value)}
              className="bg-white border border-stone text-ink px-4 py-2 rounded-full font-semibold text-sm focus:ring-2 focus:ring-pine/40 outline-none transition-all"
            >
              {beerList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select value={weeksBack} onChange={e => setWeeksBack(Number(e.target.value))} className="bg-white border border-stone text-ink px-4 py-2 rounded-full font-semibold text-sm">
              <option value={1}>Last 1 week</option>
              <option value={2}>Last 2 weeks</option>
              <option value={4}>Last 4 weeks</option>
              <option value={8}>Last 8 weeks</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-ink/60 font-semibold">Total Units Sold:</span>
            <span className="text-3xl font-display text-ink">{totalUnits}</span>
            <span className="text-ink/50 text-base font-semibold">units</span>
          </div>
        </div>

        {chartData.length === 0 ? (
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
                  tickFormatter={(ts) => new Date(Number(ts)).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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

      <div className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-display text-ink">Recommended Orders</h4>
            <div className="text-xs text-ink/60 mt-1">Auto-suggested restocks based on model and recent averages</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {perBeerRecs && Array.from(perBeerRecs.entries()).map(([beerName, qty]) => (
            <div key={beerName} className="flex items-center justify-between p-4 bg-white border border-stone rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-drift border border-stone rounded-2xl flex items-center justify-center">
                  <Box size={20} className="text-ink/70" />
                </div>
                <div>
                  <div className="font-semibold text-ink">{beerName}</div>
                  <div className="text-xs text-ink/50">Source: {perBeerSource?.get(beerName) ?? 'Avg'}</div>
                </div>
              </div>
              <div className="text-lg font-display text-ink">{qty} units</div>
            </div>
          ))}

          {!perBeerRecs && (
            <div className="p-4 text-ink/60">No recommendations available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
