import React from 'react';

interface AlertToastProps {
  message: string;
}

const AlertToast: React.FC<AlertToastProps> = ({ message }) => (
  <div className="fixed top-24 right-8 z-50 animate-slideDown">
    <div className="glass-panel px-6 py-4 rounded-xl border border-accent-green/40 flex items-center gap-3 shadow-lg">
      <div className="w-3 h-3 rounded-full bg-accent-green pulse-dot"></div>
      <span className="font-bold text-sm text-white">{message}</span>
    </div>
  </div>
);

export default AlertToast;
