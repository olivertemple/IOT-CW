import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
// import CSV as raw text via Vite so we don't rely on fetch paths
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

  // compute per-beer recommendations (prefer model if available, else use recent averages)

  // shift all dates forward in whole-week steps so the latest date aligns near today
  const shiftedRows = useMemo(() => {
    if (rows.length === 0) return [] as Row[];
    // parse timestamps safely and ignore invalid dates
    const tsList = rows.map(r => Date.parse(r.Date)).filter(ts => !isNaN(ts));
    if (tsList.length === 0) return rows;
    const latestTs = Math.max(...tsList);
    const nowTs = Date.now();
    const oneWeek = 7 * 24 * 3600 * 1000;
    const weeksDiff = Math.floor((nowTs - latestTs) / oneWeek);
    const shiftMs = (isFinite(weeksDiff) ? weeksDiff : 0) * oneWeek;
    return rows.map(r => {
      const orig = Date.parse(r.Date);
      if (isNaN(orig)) return r; // keep unchanged if date invalid
      const shifted = new Date(orig + shiftMs);
      return { ...r, Date: shifted.toISOString().slice(0, 10) };
    });
  }, [rows]);

  // filter rows for selected beer and timeframe
  const filtered = useMemo(() => {
    if (shiftedRows.length === 0) return [] as { date: string; units: number }[];
    const now = new Date();
    const from = new Date(now.getTime() - weeksBack * 7 * 24 * 3600 * 1000);
    const sel = shiftedRows.filter(r => r.Beer === beer).map(r => ({ date: new Date(r.Date), units: r.UnitsSold }));
    const inRange = sel.filter(s => s.date.getTime() >= from.getTime() && s.date.getTime() <= now.getTime());
    // aggregate by date
    const byDate = new Map<string, number>();
    inRange.forEach(s => {
      const key = s.date.toISOString().slice(0,10);
      byDate.set(key, (byDate.get(key) || 0) + s.units);
    });
    const out = Array.from(byDate.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, units]) => ({ date, units }));
    return out;
  }, [shiftedRows, beer, weeksBack]);

  const chartData = filtered.map(f => ({ bucket_ts: new Date(f.date).getTime(), time: f.date, volume: f.units }));

  const totalUnits = filtered.reduce((s, f) => s + f.units, 0);

  // (single-beer suggestion removed; per-beer recommendations shown below)

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  // compute simple averages per beer (units per week) for the selected timeframe (last `weeksBack` weeks)
  const perBeerAverages = useMemo(() => {
    if (shiftedRows.length === 0) return new Map<string, number>();
    const out = new Map<string, number>();
    const oneWeekMs = 7 * 24 * 3600 * 1000;
    const nowTs = Date.now();
    const fromTs = nowTs - weeksBack * oneWeekMs;
    const beers = Array.from(new Set(shiftedRows.map(r => r.Beer)));
    for (const beerName of beers) {
      const rowsForBeer = shiftedRows.filter(r => r.Beer === beerName && Date.parse(r.Date) >= fromTs);
      const total = rowsForBeer.reduce((s, r) => s + Number(r.UnitsSold), 0);
      out.set(beerName, total / Math.max(1, weeksBack));
    }
    return out;
  }, [shiftedRows, weeksBack]);

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
      // fall back to averages below
    }
    // fallback: use perBeerAverages
    const fallback = new Map<string, number>();
    const src = new Map<string, string>();
    for (const [b, avg] of perBeerAverages.entries()) { fallback.set(b, Math.ceil(avg)); src.set(b, 'Avg'); }
    setPerBeerRecs(fallback);
    setPerBeerSource(src);
  }, [rows, perBeerAverages]);

  // modelUsed kept if needed elsewhere

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

        <div className="mt-6 bg-white p-4 rounded-2xl border border-stone">
          <div>
            <div className="text-sm text-ink/60">Next week's orders (all beers)</div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-xs font-semibold">
              <div>Beer</div>
              <div>Units</div>
              <div>Source</div>
            </div>
            {Array.from(new Set([...(beerList || []), ...(perBeerRecs ? Array.from(perBeerRecs.keys()) : [])])).map((b:any) => (
              <div key={b} className="grid grid-cols-3 gap-4 items-center mt-2 text-sm">
                <div>{b}</div>
                <div className="font-semibold">{perBeerRecs?.get(b) ?? Math.ceil(perBeerAverages.get(b) ?? 0)}</div>
                <div className="text-ink/60 text-xs">{perBeerSource?.get(b) ?? 'Avg'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
