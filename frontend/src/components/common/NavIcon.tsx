import React from 'react';

interface NavIconProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavIcon: React.FC<NavIconProps> = ({ icon, label, active, onClick }) => {
  // Ensure icons inherit color reliably by cloning and applying className
  let renderedIcon = null as any;
  try {
    // If icon is a React element, clone it with adjusted className
    if (React.isValidElement(icon)) {
      const existing = (icon as any).props.className || '';
      const colorClass = active ? 'text-white' : 'text-white/60';
      renderedIcon = React.cloneElement(icon as React.ReactElement, { className: `${existing} ${colorClass}`.trim() });
    } else {
      renderedIcon = icon;
    }
  } catch (e) {
    renderedIcon = icon;
  }

  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-accent-amber to-accent-gold text-dark-950'
          : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
      title={label}
      aria-current={active ? 'page' : undefined}
    >
      {renderedIcon}
      <span>{label}</span>
    </button>
  );
};

export default NavIcon;
