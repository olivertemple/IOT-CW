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
    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${
      active
        ? 'bg-ink text-white border-ink'
        : 'bg-white text-ink/60 border-stone hover:text-ink hover:border-ink'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export default NavIcon;
