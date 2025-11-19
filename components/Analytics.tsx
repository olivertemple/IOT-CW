
import React, { useState, useEffect } from 'react';
import { Tap, GeminiRecommendation } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Sparkles, Loader2, TrendingUp, ArrowRight } from 'lucide-react';
import { getOrderRecommendations } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { getTrendData } from '../services/mockMqttService';

interface AnalyticsProps {
  taps: Tap[];
}

type Timeframe = 'day' | 'week' | 'month' | 'year';

export const Analytics: React.FC<AnalyticsProps> = ({ taps }) => {
  const [aiData, setAiData] = useState<GeminiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [trendData, setTrendData] = useState<any[]>([]);

  // Fetch trend data from DB via API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getHistory(timeframe);
        if (data && data.length > 0) {
            setTrendData(data);
        } else {
            // Fallback to mock if DB is empty or offline
            setTrendData(getTrendData(timeframe));
        }
      } catch (e) {
        setTrendData(getTrendData(timeframe));
      }
    };
    fetchData();
  }, [timeframe]);

  const popularityData = taps.map(t => ({
    name: t.beerName,
    consumed: t.totalConsumedLiters,
    amt: t.totalConsumedLiters
  }));

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await getOrderRecommendations(taps);
    setAiData(result);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 space-y-6">
        {/* Popularity */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-sm font-medium text-white">Volume by Brand</h3>
                <p className="text-xs text-zinc-500">Total liters poured this session</p>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularityData} barSize={32}>
                <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => val.split(' ')[0]}
                />
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="consumed" fill="#e4e4e7" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
           <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-medium text-white">Activity Trend</h3>
                    <p className="text-xs text-zinc-500">Logged Events from Database</p>
                </div>
                
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                    {(['day', 'week', 'month', 'year'] as Timeframe[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-3 py-1 text-[10px] uppercase font-medium rounded-md transition-all ${
                                timeframe === t 
                                ? 'bg-zinc-800 text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
           </div>
           <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="usage" stroke="#fff" strokeWidth={1.5} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="lg:col-span-1 h-full">
        <div className="h-full bg-zinc-900/80 border border-white/5 rounded-xl flex flex-col">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-white" />
                    <h3 className="text-sm font-medium text-white">Gemini Insights</h3>
                </div>
                <p className="text-xs text-zinc-500">AI-powered inventory analysis</p>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
                {!aiData ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        {loading ? (
                            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mb-3" />
                        ) : (
                            <button 
                                onClick={handleGenerateReport}
                                className="group flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors"
                            >
                                Generate Analysis <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Executive Summary</span>
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{aiData.summary}</p>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Suggested Orders</span>
                            <ul className="mt-2 space-y-2">
                                {aiData.orderList.map((item, i) => (
                                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                                        <span className="w-1 h-1 mt-1.5 bg-zinc-500 rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Strategy</span>
                            <p className="text-xs text-zinc-400 mt-1 italic">"{aiData.trendAnalysis}"</p>
                        </div>

                        <button onClick={() => setAiData(null)} className="text-xs text-zinc-600 hover:text-white transition-colors w-full text-center">
                            Clear Results
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
