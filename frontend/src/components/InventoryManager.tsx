import React, { useEffect, useState } from 'react';
import { Package, AlertCircle, CheckCircle, Truck, TrendingDown } from 'lucide-react';

interface Props {
  inventory: any[];
  orders: any[];
}

interface KegInventory {
  keg_id: string;
  beer_name: string;
  volume_total_ml: number;
  volume_remaining_ml: number;
  status: string;
  tap_id?: string;
  last_updated: number;
}

const InventoryManager: React.FC<Props> = ({ inventory, orders }) => {
  const [depletionData, setDepletionData] = useState<Record<string, number | null>>({});

  useEffect(() => {
    inventory.forEach(keg => {
      const uid = `${keg.tap_id || 'none'}:${keg.keg_id}`;
      fetch(`/api/depletion/${keg.keg_id}`)
        .then(r => r.json())
        .then(data => {
          if (data.days !== null && data.days !== undefined) {
            setDepletionData(prev => ({ ...prev, [uid]: parseFloat(data.days) }));
          } else {
            setDepletionData(prev => ({ ...prev, [uid]: null }));
          }
        })
        .catch(() => {
          setDepletionData(prev => ({ ...prev, [uid]: null }));
        });
    });
  }, [inventory]);

  const formatDepletionTime = (days: number | null | undefined): string => {
    if (days === null || days === undefined) return 'Calculating...';
    if (days < 1) return '<1 day';
    return `${Math.round(days)} days`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUMPING':
        return 'text-accent-green bg-accent-green/20 border-accent-green/40';
      case 'EMPTY':
        return 'text-accent-red bg-accent-red/20 border-accent-red/40';
      default:
        return 'text-white/70 bg-white/5 border-white/20';
    }
  };

  const groupedInventory = inventory.reduce((acc, keg: KegInventory) => {
    const beerName = keg.beer_name || 'Unknown Beer';
    if (!acc[beerName]) {
      acc[beerName] = [];
    }
    acc[beerName].push(keg);
    return acc;
  }, {} as Record<string, KegInventory[]>);

  const beerTypes = Object.keys(groupedInventory).sort();

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-amber to-accent-gold text-dark-950 rounded-xl flex items-center justify-center">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-xl font-display text-white font-bold">Keg Inventory</h3>
              <p className="text-xs text-white/50 uppercase tracking-[0.3em] font-semibold">Live System</p>
            </div>
          </div>
          <span className="text-xs text-white/60 font-bold bg-white/5 px-4 py-2 rounded-lg">REAL-TIME</span>
        </div>

        {beerTypes.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="mx-auto mb-4 text-white/30" size={56} />
            <div className="font-bold text-white/60 text-lg">No Keg Data Available</div>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {beerTypes.map((beerName) => (
              <div key={beerName} className="overflow-x-auto scrollbar">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                  <h4 className="font-bold text-white text-sm uppercase tracking-[0.3em]">{beerName}</h4>
                </div>
                <table className="w-full text-left text-sm text-white/80">
                  <thead className="bg-white/5 text-white/60 text-xs">
                    <tr>
                      <th className="p-4 uppercase tracking-[0.3em] font-bold">Keg ID</th>
                      <th className="p-4 uppercase tracking-[0.3em] font-bold">Volume Remaining</th>
                      <th className="p-4 uppercase tracking-[0.3em] font-bold">Status</th>
                      <th className="p-4 uppercase tracking-[0.3em] font-bold">Est. Depletion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {groupedInventory[beerName].map((keg) => {
                      const pct = (keg.volume_remaining_ml / keg.volume_total_ml) * 100;
                      const uid = `${keg.tap_id || 'none'}:${keg.keg_id}`;
                      return (
                        <tr key={uid} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">{keg.keg_id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct < 10 ? 'bg-accent-red' : 'bg-accent-green'}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="font-bold text-white min-w-[60px]">{(keg.volume_remaining_ml / 1000).toFixed(1)} L</span>
                              <span className="text-xs text-white/40">({pct.toFixed(0)}%)</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(keg.status)}`}>
                              {keg.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {pct < 10 && <TrendingDown className="text-accent-red" size={16} />}
                              <span className={pct < 10 ? 'text-accent-red font-bold' : 'text-white/60'}>
                                {formatDepletionTime(depletionData[uid])}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-green text-dark-950 rounded-xl flex items-center justify-center">
              <Truck size={22} />
            </div>
            <div>
              <h3 className="text-xl font-display text-white font-bold">Purchase Orders</h3>
              <p className="text-xs text-white/50 uppercase tracking-[0.3em] font-semibold">Auto Restock</p>
            </div>
          </div>
          <span className="text-xs bg-accent-green/20 text-accent-green px-4 py-2 rounded-lg font-bold border border-accent-green/40">AUTO-ORDER ON</span>
        </div>
        <div className="p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="mx-auto mb-4 text-accent-green" size={56} />
              <div className="font-bold text-white text-lg">No Active Orders</div>
              <div className="text-sm text-white/60 mt-2">All stock levels optimal</div>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/20 rounded-xl hover:border-white/30 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                    <Package className="text-white" size={26} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">Restock: {order.beer_name}</div>
                    <div className="text-xs text-white/50 font-mono mt-1">Ref: #{order.id} • {new Date(order.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent-red/20 text-accent-red rounded-lg border border-accent-red/40 text-xs font-bold">
                  <AlertCircle size={14} /> {order.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
