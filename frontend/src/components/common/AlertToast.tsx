import React from 'react';

interface AlertToastProps {
  message: string;
}

const AlertToast: React.FC<AlertToastProps> = ({ message }) => (
  <div className="fixed top-6 right-6 z-50 animate-slideDown">
    <div className="bg-white border border-gray-200 shadow-lg px-6 py-4 rounded-xl flex items-center gap-3">
      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
      <span className="font-medium text-gray-900">{message}</span>
    </div>
  </div>
);

export default AlertToast;
