import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, ThermometerSun, Droplet } from 'lucide-react';
import { UI_CONSTANTS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  tapState: any;
  kegState: any;
  isConnected?: boolean;
  tapId?: string | null;
}

const LiveTapView: React.FC<Props> = ({ tapState, kegState, isConnected = true, tapId = null }) => {
  const isPouring = tapState?.view === 'POURING';
  const isSwap = tapState?.view === 'SWAP';
  const pct = tapState?.volume_remaining_pct || 0;
  const temp = kegState?.temp || 4.0;
  const tempRangeMin = UI_CONSTANTS.OPTIMAL_TEMP_MIN;
  const tempRangeMax = UI_CONSTANTS.OPTIMAL_TEMP_MAX;
  const tempPct = Math.min(Math.max(((temp - tempRangeMin) / (tempRangeMax - tempRangeMin)) * 100, 0), 100);
  const flow = kegState?.flow || 0;
  const [series, setSeries] = useState<Array<{ time: string; flow: number }>>([]);
  const maxPoints = 150;
  const tickMs = 1000;
  const latestRef = useRef<number>(flow);
  const storageKey = `flow_series_${tapId || 'global'}`;

  useEffect(() => {
    latestRef.current = Number.isFinite(flow) ? flow : 0;
  }, [flow]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSeries(prev => {
        const next = prev.slice(-maxPoints + 1);
        next.push({ time: label, flow: Math.max(0, Number(latestRef.current)) });
        return next;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSeries(parsed.slice(-maxPoints));
      }
    } catch (e) {
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(series));
    } catch (e) {
    }
  }, [series, storageKey]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 max-w-[1400px] mx-auto">
      <div className="glass-panel rounded-[32px] p-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isConnected ? 'bg-pine/10 text-pine border-pine/30' : 'bg-ember/10 text-ember border-ember/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-pine' : 'bg-ember'}`}></div>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <div className="text-xs uppercase tracking-[0.4em] text-ink/40">Live Keg</div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-10">
          <div className="flex-shrink-0">
            <div className="relative h-full">
              <div className="w-[420px] h-full flex flex-col">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(t: string) => t.slice(-8)}
                      minTickGap={12}
                    />
                    <YAxis
                      domain={[0, UI_CONSTANTS.MAX_FLOW_RATE_LPM]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(v: number) => `${Math.round(v)}`}
                    />
                    <Tooltip formatter={(value: any) => [`${value} L/min`, 'Flow']} />
                    <Area type="monotone" dataKey="flow" stroke="#10b981" fill="url(#flowGradient)" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-ink/50 mb-3">Current Beer</div>
              <h2 className="text-4xl font-display text-ink">
                {tapState?.beer_name || 'No Keg Connected'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-stone">
              <div className="p-5 rounded-2xl border border-stone bg-white">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50 mb-3">
                  <ThermometerSun size={16} /> Temperature
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-semibold ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'text-ember' : 'text-ink'}`}>{temp.toFixed(1)}</span>
                  <span className="text-xl text-ink/40 font-semibold">°C</span>
                </div>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                  temp > UI_CONSTANTS.HIGH_TEMP_WARNING
                    ? 'bg-ember/10 text-ember border border-ember/30'
                    : 'bg-pine/10 text-pine border border-pine/30'
                }`}>
                  {temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'High' : 'Optimal'}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-stone bg-white">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50 mb-3">
                  <Droplet size={16} /> Flow Rate
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-semibold ${isPouring ? 'text-pine' : 'text-ink/40'}`}>
                    {flow.toFixed(1)}
                  </span>
                  <span className="text-xl text-ink/40 font-semibold">L/min</span>
                </div>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                  isPouring
                    ? 'bg-pine/10 text-pine border border-pine/30'
                    : 'bg-ink/5 text-ink/60 border border-stone'
                }`}>
                  {isPouring ? 'Active' : 'Idle'}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-stone">
              <div>
                <div className="flex justify-between text-xs text-ink/60 mb-2">
                  <span>Temperature Range</span>
                  <span>{UI_CONSTANTS.OPTIMAL_TEMP_MIN}-{UI_CONSTANTS.OPTIMAL_TEMP_MAX}°C</span>
                </div>
                <div className="h-2 bg-drift rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${temp > UI_CONSTANTS.HIGH_TEMP_WARNING ? 'bg-ember' : 'bg-pine'}`}
                    animate={{ width: `${tempPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-ink/60 mb-2">
                  <span>Flow Capacity</span>
                  <span>Max {UI_CONSTANTS.MAX_FLOW_RATE_LPM} LPM</span>
                </div>
                <div className="h-2 bg-drift rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-ink"
                    animate={{ width: `${Math.min((flow / UI_CONSTANTS.MAX_FLOW_RATE_LPM) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {isSwap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[32px]"
          >
            <div className="w-16 h-16 border-4 border-t-ink border-r-ink border-b-stone border-l-stone rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-display text-ink mb-2">Keg Swap in Progress</h3>
            <p className="text-ink/60">Please wait while the system updates...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LiveTapView;
