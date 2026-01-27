import { useState, useEffect } from 'react';

export const useInventoryData = (socket: any, isConnected: boolean) => {
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

  return { inventory, orders };
};
