import { useState, useEffect } from 'react';

export const useInventoryData = (socket: any, isConnected: boolean, selectedTap: string | null) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('inventory_data', (data: any) => setInventory(data));
    socket.on('orders_data', (data: any) => setOrders(data));

    return () => {
      socket.off('inventory_data');
      socket.off('orders_data');
    };
  }, [socket]);

  const displayedInventory = selectedTap 
    ? inventory.filter((i: any) => i.tap_id === selectedTap) 
    : inventory;

  return { inventory: displayedInventory, orders };
};
