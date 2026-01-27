import React from 'react';

interface AlertToastProps {
  message: string;
}

const AlertToast: React.FC<AlertToastProps> = ({ message }) => (
  <div className="fixed top-24 right-8 z-50 animate-slideDown">
    <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full bg-pine"></div>
      <span className="font-semibold text-sm text-ink">{message}</span>
    </div>
  </div>
);

export default AlertToast;
