import { useState, useEffect } from 'react';

export const useHistoryData = (socket: any) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('history_data', (data: any) => setHistory(data));

    return () => {
      socket.off('history_data');
    };
  }, [socket]);

  return history;
};
