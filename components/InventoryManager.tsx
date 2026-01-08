
import React, { useEffect, useState } from 'react';
import { Package, AlertCircle, CheckCircle, Truck, TrendingDown } from 'lucide-react';

interface Props {
  inventory: any[];
  orders: any[];
}

const InventoryManager: React.FC<Props> = ({ inventory, orders }) => {
  const [depletionData, setDepletionData] = useState<Record<string, number | null>>({});

  // Fetch depletion estimates for all kegs
  useEffect(() => {
    inventory.forEach(keg => {
      fetch(`/api/depletion/${keg.keg_id}`)
        .then(r => r.json())
        .then(data => {
          if (data.days !== null && data.days !== undefined) {
            setDepletionData(prev => ({ ...prev, [keg.keg_id]: parseFloat(data.days) }));
          } else {
            setDepletionData(prev => ({ ...prev, [keg.keg_id]: null }));
          }
        })
        .catch(() => {
          setDepletionData(prev => ({ ...prev, [keg.keg_id]: null }));
        });
    });
  }, [inventory]);

  const formatDepletionTime = (days: number | null | undefined): string => {
    if (days === null || days === undefined) return 'Calculating...';
    if (days < 1) return '<1 day';
    return `${Math.round(days)} days`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'PUMPING': return 'text-green-700 bg-green-100 border-green-200';
        case 'EMPTY': return 'text-red-700 bg-red-100 border-red-200';
        default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  // Group inventory by beer type/tap
  const groupedInventory = inventory.reduce((acc, keg) => {
    const beerName = keg.beer_name || 'Unknown Beer';
    if (!acc[beerName]) {
      acc[beerName] = [];
    }
    acc[beerName].push(keg);
    return acc;
  }, {} as Record<string, any[]>);

  const beerTypes = Object.keys(groupedInventory).sort();

  return (
    <div className="space-y-6">
      {/* Stock Levels - Grouped by Beer Type */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Package className="text-indigo-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Connected Stock</h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">Synced with Valve Box</span>
        </div>
        
        {beerTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-3 text-gray-400" size={48} />
            <div className="font-semibold text-gray-600">No Keg Data Available</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {beerTypes.map((beerName) => (
              <div key={beerName} className="overflow-x-auto">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{beerName}</h4>
                </div>
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-white text-gray-900 font-semibold text-xs">
                    <tr>
                      <th className="p-4">Keg ID</th>
                      <th className="p-4">Volume Remaining</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Est. Depletion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupedInventory[beerName].map((keg) => {
                      const pct = (keg.volume_remaining_ml / keg.volume_total_ml) * 100;
                      return (
                        <tr key={keg.keg_id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-gray-900">{keg.keg_id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct < 10 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="font-bold text-gray-900 min-w-[60px]">{(keg.volume_remaining_ml / 1000).toFixed(1)} L</span>
                              <span className="text-xs text-gray-500">({pct.toFixed(0)}%)</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(keg.status)}`}>
                              {keg.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {pct < 10 && <TrendingDown className="text-red-500" size={16} />}
                              <span className={pct < 10 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                {formatDepletionTime(depletionData[keg.keg_id])}
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

      {/* Auto Orders */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
         <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Truck className="text-green-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Purchase Orders</h3>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold border border-green-200">Auto-Order Enabled</span>
        </div>
        <div className="p-6 space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
                    <div className="font-semibold text-gray-900">No active orders</div>
                    <div className="text-sm text-gray-600 mt-1">All stock levels optimal</div>
                </div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="text-gray-600" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-base">Restock: {order.beer_name}</div>
                                <div className="text-sm text-gray-600 font-mono mt-0.5">Ref: #{order.id} • {new Date(order.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 text-xs font-semibold">
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
