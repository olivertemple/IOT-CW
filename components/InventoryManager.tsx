
import React from 'react';
import { Package, AlertCircle, CheckCircle, Truck, TrendingDown } from 'lucide-react';

interface Props {
  inventory: any[];
  orders: any[];
}

const InventoryManager: React.FC<Props> = ({ inventory, orders }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
        case 'PUMPING': return 'text-green-400 bg-green-500/20 border-green-500/30';
        case 'EMPTY': return 'text-red-400 bg-red-500/20 border-red-500/30';
        default: return 'text-slate-400 bg-slate-800/50 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stock Levels */}
      <div className="bg-gradient-to-br from-[#1a1f35] to-[#151928] rounded-2xl border border-[#2a3350] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#2a3350] flex justify-between items-center bg-[#151928]/50">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Package className="text-white" size={24} />
                </div>
                Connected Stock
            </h3>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wide px-4 py-2 bg-[#1a1f35] rounded-full border border-[#2a3350]">● Synced with Valve Box</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400 enhanced-table">
                <thead className="bg-[#0a0e1a] text-slate-300 font-bold uppercase text-xs">
                    <tr>
                        <th className="p-5">Keg ID</th>
                        <th className="p-5">Beer Type</th>
                        <th className="p-5">Volume Remaining</th>
                        <th className="p-5">Status</th>
                        <th className="p-5">Est. Depletion</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3350]">
                    {inventory.map((keg) => {
                        const pct = (keg.volume_remaining_ml / keg.volume_total_ml) * 100;
                        return (
                            <tr key={keg.keg_id} className="hover:bg-[#1a1f35]/50 transition-all">
                                <td className="p-5 font-mono font-bold text-white">{keg.keg_id}</td>
                                <td className="p-5 font-semibold text-slate-200">{keg.beer_name}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 progress-bar">
                                            <div className={`progress-fill ${pct < 10 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`} style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <span className="font-bold text-white min-w-[60px]">{(keg.volume_remaining_ml / 1000).toFixed(1)} L</span>
                                        <span className="text-xs text-slate-500">({pct.toFixed(0)}%)</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(keg.status)}`}>
                                        {keg.status}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        {pct < 10 && <TrendingDown className="text-red-400" size={16} />}
                                        <span className={pct < 10 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                            {pct < 10 ? 'Today' : '3 Days'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {inventory.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-slate-600">
                            <Package className="mx-auto mb-3 text-slate-700" size={48} />
                            <div className="font-semibold">No Keg Data Available</div>
                        </td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Auto Orders */}
      <div className="bg-gradient-to-br from-[#1a1f35] to-[#151928] rounded-2xl border border-[#2a3350] overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-[#2a3350] flex justify-between items-center bg-[#151928]/50">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                    <Truck className="text-white" size={24} />
                </div>
                Purchase Orders
            </h3>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full border border-blue-500/30 font-bold uppercase tracking-wide">✓ Auto-Order Enabled</span>
        </div>
        <div className="p-6 space-y-4">
            {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                    <CheckCircle className="mx-auto mb-3 text-slate-700" size={48} />
                    <div className="font-semibold">No active orders</div>
                    <div className="text-sm text-slate-700 mt-1">All stock levels optimal</div>
                </div>
            ) : (
                orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-5 bg-[#1a1f35]/80 rounded-xl border border-[#2a3350] hover-lift">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-[#0a0e1a] to-[#151928] rounded-xl text-slate-400 border border-[#2a3350]">
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-lg">Restock: {order.beer_name}</div>
                                <div className="text-sm text-slate-400 font-mono mt-1">Ref: #{order.id} • {new Date(order.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 text-xs font-bold uppercase tracking-wide">
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
