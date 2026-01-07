import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onNavigate?: (sectionId: string) => void;
}

const ArchitectureDiagram: React.FC<Props> = ({ onNavigate }) => {
  const handleNav = (id: string) => {
    if (onNavigate) onNavigate(id);
  };

  return (
    <div className="w-full bg-slate-900 p-8 rounded-xl border border-slate-700 overflow-hidden flex justify-center">
      <svg width="800" height="400" viewBox="0 0 800 400" className="w-full max-w-4xl select-none">
        {/* Background Grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
        </pattern>
        <rect width="800" height="400" fill="url(#grid)" />

        {/* Interactive Zones Hint */}
        <text x="400" y="380" textAnchor="middle" fill="#475569" fontSize="12">
          (Click on a device to view its documentation)
        </text>

        {/* Connections - Lines */}
        <motion.path 
            d="M 150 200 L 400 200" 
            stroke="#3b82f6" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="5,5"
            animate={{ strokeDashoffset: -20 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
         <motion.path 
            d="M 400 200 L 650 100" 
            stroke="#10b981" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="5,5"
            animate={{ strokeDashoffset: -20 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
         <motion.path 
            d="M 400 200 L 650 300" 
            stroke="#10b981" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="5,5"
            animate={{ strokeDashoffset: -20 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />

        {/* TAP Device */}
        <motion.g 
          transform="translate(50, 150)"
          onClick={() => handleNav('tap-device')}
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
          <rect width="100" height="100" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" className="hover:fill-slate-800 transition-colors" />
          <text x="50" y="40" textAnchor="middle" fill="#fff" className="text-sm font-bold pointer-events-none">TAP UI</text>
          <text x="50" y="60" textAnchor="middle" fill="#94a3b8" className="text-xs pointer-events-none">tap-01/ui</text>
          <circle cx="50" cy="80" r="5" fill="#ef4444">
             <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </motion.g>

        {/* VALVE BOX */}
        <motion.g 
          transform="translate(350, 150)"
          onClick={() => handleNav('valve-box')}
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
            <rect width="100" height="100" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" className="hover:fill-slate-800 transition-colors" />
            <text x="50" y="40" textAnchor="middle" fill="#fff" className="text-sm font-bold pointer-events-none">VALVE BOX</text>
            <text x="50" y="60" textAnchor="middle" fill="#94a3b8" className="text-xs pointer-events-none">Orchestrator</text>
            <rect x="30" y="70" width="40" height="10" rx="2" fill="#f59e0b" opacity="0.8"/>
        </motion.g>

        {/* KEG 1 */}
        <motion.g 
          transform="translate(650, 50)"
          onClick={() => handleNav('keg-device')}
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
            <rect width="100" height="100" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" className="hover:fill-slate-800 transition-colors" />
            <text x="50" y="30" textAnchor="middle" fill="#fff" className="text-sm font-bold pointer-events-none">KEG A</text>
            <text x="50" y="50" textAnchor="middle" fill="#94a3b8" className="text-xs pointer-events-none">Active</text>
            <path d="M 30 70 L 70 70 L 50 90 Z" fill="#10b981" />
        </motion.g>

        {/* KEG 2 */}
        <motion.g 
          transform="translate(650, 250)"
          onClick={() => handleNav('keg-device')}
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
            <rect width="100" height="100" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" className="hover:fill-slate-800 transition-colors" />
            <text x="50" y="30" textAnchor="middle" fill="#fff" className="text-sm font-bold pointer-events-none">KEG B</text>
            <text x="50" y="50" textAnchor="middle" fill="#94a3b8" className="text-xs pointer-events-none">Standby</text>
            <circle cx="50" cy="80" r="8" stroke="#64748b" fill="none" />
        </motion.g>
        
        {/* Labels */}
        <text onClick={() => handleNav('protocol-spec')} x="250" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle" className="cursor-pointer hover:fill-white transition-colors">tap-01/ui/event</text>
        <text onClick={() => handleNav('protocol-spec')} x="520" y="160" fill="#94a3b8" fontSize="10" textAnchor="middle" className="cursor-pointer hover:fill-white transition-colors">tap-01/keg/keg-A/command</text>
      </svg>
    </div>
  );
};

export default ArchitectureDiagram;