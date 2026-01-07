import React, { useState, useEffect } from 'react';
import { Scenario, SequenceStep } from '../types';
import { SCENARIOS } from '../constants';
import { CheckCircle2, Play, Pause, RotateCcw } from 'lucide-react';

const SequenceVisualizer: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [selectedStep, setSelectedStep] = useState<SequenceStep | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setSelectedStep(current => {
          const currentIndex = current ? activeScenario.steps.findIndex(s => s.id === current.id) : -1;
          if (currentIndex < activeScenario.steps.length - 1) {
            return activeScenario.steps[currentIndex + 1];
          } else {
            setIsPlaying(false);
            return current;
          }
        });
      }, 1500); // 1.5s per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeScenario]);

  const handleScenarioChange = (s: Scenario) => {
    setActiveScenario(s);
    setSelectedStep(null);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6">
      {/* Control Panel */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Select Scenario</h3>
            <div className="flex flex-col gap-2">
                {SCENARIOS.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => handleScenarioChange(s)}
                        className={`px-4 py-3 rounded text-left text-sm transition-colors ${activeScenario.id === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        <div className="font-bold">{s.title}</div>
                        <div className="text-xs opacity-75 truncate">{s.description}</div>
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex gap-2">
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold text-sm transition-colors ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
            >
                {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Auto-Play</>}
            </button>
             <button 
                onClick={() => { setIsPlaying(false); setSelectedStep(null); }}
                className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                title="Reset"
            >
                <RotateCcw size={16} />
            </button>
        </div>

        <div className={`bg-slate-900 p-4 rounded-lg border shadow-xl transition-all duration-300 ${selectedStep ? 'border-blue-500/50 opacity-100 translate-y-0' : 'border-slate-800 opacity-50 translate-y-2'}`}>
            <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">
                {selectedStep ? `Step ${String(selectedStep.id).padStart(2, '0')} Detail` : 'Select a step'}
            </h4>
            <p className="text-white font-medium mb-2 min-h-[3rem]">
                {selectedStep?.description || 'Click on a step or use Auto-Play to view details.'}
            </p>
            <div className="bg-black/50 p-2 rounded font-mono text-xs text-green-400 overflow-x-auto h-24">
                {selectedStep?.payload ? JSON.stringify(selectedStep.payload, null, 2) : '// No Payload'}
            </div>
        </div>
      </div>

      {/* Diagram View */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-xl border border-slate-700 p-6 relative overflow-hidden min-h-[500px]">
        {/* Lifelines */}
        <div className="grid grid-cols-4 h-full absolute top-0 left-0 w-full pointer-events-none opacity-10">
             <div className="border-r border-slate-500 h-full"></div>
             <div className="border-r border-slate-500 h-full"></div>
             <div className="border-r border-slate-500 h-full"></div>
             <div className="h-full"></div>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-4 mb-8 relative z-10">
            {['Tap', 'ValveBox', 'Keg1', 'Keg2'].map((device, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg transition-transform duration-300
                        ${device === 'ValveBox' ? 'bg-amber-900 border-amber-500 text-amber-100' : 'bg-slate-800 border-slate-600 text-slate-200'}
                        ${selectedStep && (selectedStep.from === device || selectedStep.to === device) ? 'scale-110 ring-2 ring-white/20' : ''}
                    `}>
                        {device}
                    </div>
                </div>
            ))}
        </div>

        {/* Steps */}
        <div className="space-y-4 relative z-10">
            {activeScenario.steps.map((step, index) => {
                const colMap: Record<string, number> = { 'Tap': 0, 'ValveBox': 1, 'Keg1': 2, 'Keg2': 3 };
                const startCol = colMap[step.from];
                const endCol = colMap[step.to];
                const isSelf = startCol === endCol;
                const direction = endCol > startCol ? 'ltr' : 'rtl';
                
                // Calculate offset based on start column
                const leftPos = Math.min(startCol, endCol) * 25 + 12.5 + '%';
                const style = {
                    left: leftPos,
                    width: isSelf ? '25%' : `calc(${Math.abs(endCol - startCol) * 25}% - 20px)`
                };

                const isActive = selectedStep?.id === step.id;

                return (
                    <div 
                        key={step.id} 
                        className={`relative h-12 flex items-center group cursor-pointer transition-all duration-200 ${isActive ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-90'}`}
                        onClick={() => { setSelectedStep(step); setIsPlaying(false); }}
                    >
                        <div className={`absolute left-4 -top-2 text-[10px] font-mono transition-colors ${isActive ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                            {(index + 1).toString().padStart(2, '0')}
                        </div>
                        
                        {isSelf ? (
                             <div 
                                style={{ left: `${startCol * 25 + 12.5}%` }}
                                className={`absolute flex items-center justify-center w-8 h-8 border border-dashed rounded-full z-20 transition-colors ${isActive ? 'bg-blue-900 border-blue-500' : 'bg-slate-800 border-slate-500'}`}
                             >
                                <CheckCircle2 size={14} className={isActive ? "text-blue-400" : "text-slate-400"} />
                             </div>
                        ) : (
                            <div 
                                style={style} 
                                className={`absolute h-0.5 flex items-center ${direction === 'rtl' ? 'flex-row-reverse' : ''} ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`}
                            >
                                {/* Arrow Head */}
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400' : 'bg-slate-500'} ${direction === 'rtl' ? '-ml-1' : '-mr-1'}`}></div>
                                <div className={`absolute -top-5 w-full text-center text-[10px] font-mono truncate px-2 rounded transition-all ${isActive ? 'text-white bg-blue-600 scale-110 z-30' : 'text-slate-400 bg-slate-900/80'}`}>
                                    {step.action}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default SequenceVisualizer;