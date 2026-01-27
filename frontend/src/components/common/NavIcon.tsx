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
    className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold transition-all border ${
      active
        ? 'bg-ink text-white border-ink'
        : 'bg-white text-ink/60 border-stone hover:text-ink hover:border-ink'
    }`}
    title={label}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default NavIcon;
