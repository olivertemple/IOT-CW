import React from 'react';

interface NavIconProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavIcon: React.FC<NavIconProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export default NavIcon;
