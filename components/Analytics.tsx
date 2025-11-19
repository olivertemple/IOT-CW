import React, { useState, useEffect } from 'react';
import { Tap } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Sparkles } from 'lucide-react';
import { apiService } from '../services/apiService';
import { getTrendData } from '../services/mockMqttService';

interface AnalyticsProps {
  taps: Tap[];
}

type Timeframe = 'day' | 'week' | 'month' | 'year';

export const Analytics: React.FC<AnalyticsProps> = ({ taps }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [popularityData, setPopularityData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getHistory(timeframe);
        if (data && data.length > 0) {
          setTrendData(data);
        } else {
          setTrendData(getTrendData(timeframe));
        }
      } catch {
        setTrendData(getTrendData(timeframe));
      }
    };
    fetchData();
  }, [timeframe]);

  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        const res = await apiService.getVolumeByBrand(timeframe);
        if (res && res.length > 0) {
          const sumTotal = res.reduce((s: number, r: any) => s + (Number(r.totalPoured) || 0), 0);
          if (sumTotal > 0) {
            setPopularityData(res.map((r: any) => ({ name: r.name, consumed: Math.round(r.totalPoured), amt: Math.round(r.totalPoured) })));
            return;
          }
        }
      } catch (e) {
        // fallthrough to fallback
      }

      // Fallbacks when DB doesn't have timeframe data:
      // 1) If DB returns zero totals, show lifetime totals so user sees something.
      // 2) Otherwise approximate using lifetime totals scaled to trend aggregate.
      const lifetimeTotals = taps.map(t => ({ name: t.beerName, consumed: Math.round(t.totalConsumedLiters || 0), amt: Math.round(t.totalConsumedLiters || 0) }));
      const totalLifetime = lifetimeTotals.reduce((s, x) => s + (x.consumed || 0), 0);
      if (totalLifetime > 0) {
        setPopularityData(lifetimeTotals);
        return;
      }

      // Fallback: approximate using lifetime totals scaled to trend aggregate
      const totalTrendUsage = trendData.reduce((s, d) => s + (d.usage || 0), 0);
      const sumTapTotals = taps.reduce((s, t) => s + (t.totalConsumedLiters || 0), 0) || 1;
      const approx = taps.map(t => {
        const consumed = sumTapTotals > 0 ? Math.round((t.totalConsumedLiters / sumTapTotals) * totalTrendUsage) : Math.round(t.totalConsumedLiters || 0);
        return { name: t.beerName, consumed, amt: consumed };
      });
      setPopularityData(approx);
    };
    fetchVolumes();
  }, [timeframe, trendData, taps]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1">
          {(['day', 'week', 'month', 'year'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-[10px] uppercase font-medium rounded-md transition-all ${
                timeframe === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-medium text-white">Volume by Brand</h3>
                <p className="text-xs text-zinc-500">Total poured (selected timeframe)</p>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularityData} barSize={32}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} tickFormatter={(val) => String(val).split(' ')[0]} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="consumed" fill="#e4e4e7" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-medium text-white">Activity Trend</h3>
                <p className="text-xs text-zinc-500">Logged Events from Database</p>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="usage" stroke="#fff" strokeWidth={1.5} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 h-full">
          <div className="h-full bg-zinc-900/80 border border-white/5 rounded-xl flex flex-col">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-white" />
                <h3 className="text-sm font-medium text-white">analytical insights</h3>
              </div>
              <p className="text-xs text-zinc-500">Placeholder area — analytics module coming later</p>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center text-center text-zinc-500">
              <div>
                <p className="text-sm">This space is reserved for future analytical visualisations and insights.</p>
                <p className="text-xs mt-2">Use the timeframe selector above to change the scope of all charts on this page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
