import { useState, useEffect } from 'react';
import { initSocket, disconnectSocket } from '../services/socket';
import { BACKEND_URL } from '../constants';

// Auto-create tap record on first update (handles late-arriving MQTT messages)
const updateTapInList = (prev: any[], tapId: string, updates: any) => {
  const tapIndex = prev.findIndex(t => t.tapId === tapId);
  if (tapIndex >= 0) {
    const updated = [...prev];
    updated[tapIndex] = { ...updated[tapIndex], ...updates };
    return updated;
  } else {
    return [...prev, { tapId, tap: {}, activeKeg: {}, ...updates }];
  }
};

export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const socketInstance = initSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));
    socketInstance.on('connect_error', () => setIsConnected(false));

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      disconnectSocket();
    };
  }, []);

  return { socket, isConnected };
};

export const useTapData = (socket: any, isConnected: boolean) => {
  const [allTaps, setAllTaps] = useState<any[]>([]);
  

  useEffect(() => {
    if (!socket) return;

    const handleTapUpdate = (data: any) => {
      // `tap_update` may include an `isConnected` flag from the server.
      const updates: any = { tap: data };
      if (typeof data.isConnected === 'boolean') updates.isConnected = data.isConnected;
      setAllTaps(prev => updateTapInList(prev, data.tapId, updates));
    };

    const handleKegUpdate = (data: any) => {
      setAllTaps(prev => updateTapInList(prev, data.tapId, { activeKeg: data }));
    };

    const handleTapDeleted = (data: any) => {
      setAllTaps(prev => prev.filter(t => t.tapId !== data.tapId));
    };

    const handleTapStatusChanged = (data: any) => {
      setAllTaps(prev => updateTapInList(prev, data.tapId, { isConnected: data.isConnected }));
    };

    socket.on('tap_update', handleTapUpdate);
    socket.on('keg_update', handleKegUpdate);
    socket.on('tap_deleted', handleTapDeleted);
    socket.on('tap_status_changed', handleTapStatusChanged);

    return () => {
      socket.off('tap_update', handleTapUpdate);
      socket.off('keg_update', handleKegUpdate);
      socket.off('tap_deleted', handleTapDeleted);
      socket.off('tap_status_changed', handleTapStatusChanged);
    };
  }, [socket]);

  // Fetch initial state via HTTP when socket connects (real-time updates come via socket)
  useEffect(() => {
    if (isConnected) {
      fetch(`${BACKEND_URL}/api/taps`)
        .then(res => res.json())
        .then(data => setAllTaps(data.taps || []))
        .catch(err => console.error('Failed to fetch taps:', err));
    }
  }, [isConnected]);

  

  return allTaps;
};
