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
        return 'text-pine bg-pine/10 border-pine/30';
      case 'EMPTY':
        return 'text-ember bg-ember/10 border-ember/30';
      default:
        return 'text-ink/70 bg-white border-stone';
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
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-stone flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink text-white rounded-2xl flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-display text-ink">Connected Stock</h3>
              <p className="text-xs text-ink/50 uppercase tracking-[0.3em]">Synced with Valve Box</p>
            </div>
          </div>
          <span className="text-xs text-ink/60 font-semibold">Live Snapshot</span>
        </div>

        {beerTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-3 text-ink/30" size={48} />
            <div className="font-semibold text-ink/60">No Keg Data Available</div>
          </div>
        ) : (
          <div className="divide-y divide-stone">
            {beerTypes.map((beerName) => (
              <div key={beerName} className="overflow-x-auto scrollbar">
                <div className="bg-drift px-4 py-3 border-b border-stone">
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-[0.3em]">{beerName}</h4>
                </div>
                <table className="w-full text-left text-sm text-ink/80">
                  <thead className="bg-white text-ink text-xs">
                    <tr>
                      <th className="p-4 uppercase tracking-[0.3em]">Keg ID</th>
                      <th className="p-4 uppercase tracking-[0.3em]">Volume Remaining</th>
                      <th className="p-4 uppercase tracking-[0.3em]">Status</th>
                      <th className="p-4 uppercase tracking-[0.3em]">Est. Depletion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone">
                    {groupedInventory[beerName].map((keg) => {
                      const pct = (keg.volume_remaining_ml / keg.volume_total_ml) * 100;
                      const uid = `${keg.tap_id || 'none'}:${keg.keg_id}`;
                      const isEmpty = (keg.volume_remaining_ml || 0) <= 0;
                      const displayStatus = isEmpty ? 'EMPTY' : keg.status;
                      return (
                        <tr key={uid} className="hover:bg-white/60 transition-colors">
                          <td className="p-4 font-mono font-semibold text-ink">{keg.keg_id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-2 bg-drift rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct < 10 ? 'bg-ember' : 'bg-pine'}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="font-semibold text-ink min-w-[60px]">{(keg.volume_remaining_ml / 1000).toFixed(1)} L</span>
                              <span className="text-xs text-ink/40">({pct.toFixed(0)}%)</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {!isEmpty && pct < 10 && <TrendingDown className="text-ember" size={16} />}
                              <span className={isEmpty ? 'text-ink/60 font-semibold' : pct < 10 ? 'text-ember font-semibold' : 'text-ink/60'}>
                                {isEmpty ? 'Empty' : formatDepletionTime(depletionData[uid])}
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
    </div>
  );
};

export default InventoryManager;
