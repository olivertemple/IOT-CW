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
      const colorClass = active ? 'text-ink' : 'text-ink/60';
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
      className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold transition-all border ${
        active
          ? 'bg-ink/10 text-ink border-ink'
          : 'bg-white text-ink/60 border-stone hover:text-ink hover:border-ink'
      }`}
      title={label}
      aria-pressed={active}
    >
      {renderedIcon}
      <span>{label}</span>
    </button>
  );
};

export default NavIcon;
