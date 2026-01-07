
import React from 'react';
import { Package, AlertCircle, CheckCircle, Truck } from 'lucide-react';

interface Props {
  inventory: any[];
  orders: any[];
}

const InventoryManager: React.FC<Props> = ({ inventory, orders }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
        case 'PUMPING': return 'text-green-400 bg-green-900/30 border-green-800';
        case 'EMPTY': return 'text-red-400 bg-red-900/30 border-red-800';
        default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stock Levels */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="text-blue-500" /> Connected Stock
            </h3>
            <span className="text-xs text-slate-500 uppercase font-mono">Synced with Valve Box</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-200 font-semibold uppercase text-xs">
                    <tr>
                        <th className="p-4">Keg ID</th>
                        <th className="p-4">Beer Type</th>
                        <th className="p-4">Volume Remaining</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Est. Depletion</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {inventory.map((keg) => {
                        const pct = (keg.volume_remaining_ml / keg.volume_total_ml) * 100;
                        return (
                            <tr key={keg.keg_id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono text-white">{keg.keg_id}</td>
                                <td className="p-4">{keg.beer_name}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${pct < 10 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <span>{(keg.volume_remaining_ml / 1000).toFixed(1)} L</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(keg.status)}`}>
                                        {keg.status}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500">
                                    {pct < 10 ? 'Today' : '3 Days'}
                                </td>
                            </tr>
                        );
                    })}
                    {inventory.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-600">No Keg Data Available</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Auto Orders */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
         <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="text-amber-500" /> Purchase Orders
            </h3>
            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800">AUTO-ORDER ENABLED</span>
        </div>
        <div className="p-6 space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-600">No active orders</div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-full text-slate-400">
                                <Package size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Restock: {order.beer_name}</div>
                                <div className="text-xs text-slate-400 font-mono">Ref: #{order.id} • {new Date(order.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/20 text-amber-500 rounded-full border border-amber-900/50 text-xs font-bold uppercase">
                            <AlertCircle size={12} /> {order.status}
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
