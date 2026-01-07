import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { time: 0, weight: 5000, flowInt: 5000, fused: 5000 },
  { time: 1, weight: 4980, flowInt: 4950, fused: 4965 },
  { time: 2, weight: 4920, flowInt: 4900, fused: 4910 },
  { time: 3, weight: 4850, flowInt: 4850, fused: 4850 },
  { time: 4, weight: 4810, flowInt: 4800, fused: 4805 },
  { time: 5, weight: 4700, flowInt: 4750, fused: 4725 }, // Weight noise spike down
  { time: 6, weight: 4750, flowInt: 4700, fused: 4690 }, // Weight noise spike up
  { time: 7, weight: 4650, flowInt: 4650, fused: 4650 },
  { time: 8, weight: 4600, flowInt: 4600, fused: 4600 },
  { time: 9, weight: 4550, flowInt: 4550, fused: 4550 },
  { time: 10, weight: 4500, flowInt: 4500, fused: 4500 },
];

const SensorFusionChart: React.FC = () => {
  return (
    <div className="w-full bg-slate-900 p-6 rounded-xl border border-slate-700">
      <h3 className="text-slate-200 font-semibold mb-4">Sensor Fusion: Volume Estimation</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} />
            <YAxis stroke="#94a3b8" domain={[4000, 5200]} label={{ value: 'Volume (ml)', angle: -90, position: 'insideLeft' }}/>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="weight" stroke="#94a3b8" strokeDasharray="5 5" name="Raw Load Cell" dot={false} />
            <Line type="monotone" dataKey="flowInt" stroke="#f59e0b" name="Flow Integral" dot={false} />
            <Line type="monotone" dataKey="fused" stroke="#3b82f6" strokeWidth={3} name="Fused Estimate" dot={{r: 4}} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-slate-400 text-xs mt-4">
        *Note: Load Cell data is noisy (grey dashed). Flow Integral (orange) is smooth but drifts. The Fused Estimate (blue) combines short-term accuracy of flow with long-term stability of weight.
      </p>
    </div>
  );
};

export default SensorFusionChart;
