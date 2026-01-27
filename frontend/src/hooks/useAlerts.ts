import { useState, useEffect } from 'react';
import { UI_CONSTANTS } from '../constants';

export const useAlerts = (socket: any) => {
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleAlert = (data: any) => {
      setAlert(data.msg);
      setTimeout(() => setAlert(null), UI_CONSTANTS.ALERT_DURATION_MS);
    };

    socket.on('alert', handleAlert);

    return () => {
      socket.off('alert');
    };
  }, [socket]);

  const showAlert = (message: string) => {
    setAlert(message);
    setTimeout(() => setAlert(null), UI_CONSTANTS.ALERT_DURATION_MS);
  };

  return { alert, showAlert };
};
