import { DOC_SECTIONS, SCENARIOS } from '../constants';

export const generateOfflineHTML = () => {
  // We encode the data on the host side to ensure it passes through the template literal safely
  // without any risk of unescaped quotes, backticks, or newlines breaking the generated script.
  const safeSections = globalThis.encodeURIComponent(JSON.stringify(DOC_SECTIONS));
  const safeScenarios = globalThis.encodeURIComponent(JSON.stringify(SCENARIOS));

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SmartTap Docs (Offline)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Use cdnjs for reliability -->
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <style>
    body { background-color: #0f172a; color: #e2e8f0; font-family: sans-serif; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; border: 1px solid #334155; }
    #error-boundary { display: none; padding: 20px; background: #ef4444; color: white; margin: 20px; border-radius: 8px; border: 1px solid #b91c1c; }
    .diagram-grid { background-image: radial-gradient(#334155 1px, transparent 1px); background-size: 20px 20px; }
  </style>
</head>
<body>
  <div id="error-boundary"></div>
  <div id="root"></div>

  <script>
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const err = document.getElementById('error-boundary');
      err.style.display = 'block';
      err.innerHTML = '<strong>Runtime Error:</strong><br>' + msg + '<br><br>Line: ' + lineNo + '<br><small>Note: This file requires internet access to load React libraries from CDN.</small>';
      return false;
    };
  </script>

  <script type="text/babel" data-presets="react,env">
    // Check dependencies
    if (!window.React || !window.ReactDOM) {
      throw new Error("React libraries failed to load. Check your internet connection.");
    }

    const { useState, useEffect, useMemo } = React;
    
    // --- SAFE DATA DECODING ---
    // This prevents syntax errors from special characters in the JSON
    const SECTIONS = JSON.parse(decodeURIComponent("${safeSections}"));
    const SCENARIOS = JSON.parse(decodeURIComponent("${safeScenarios}"));

    // --- ICONS ---
    const Icons = {
      Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
      Pause: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
      Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>,
      Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
      Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    };

    // --- COMPONENTS ---

    const MarkdownRenderer = ({ content }) => {
      // Split code blocks ( \`\`\` ) from text
      // Using hex escape for backticks to avoid breaking the template literal
      const parts = content.split(/(\\x60\\x60\\x60[\\s\\S]*?\\x60\\x60\\x60)/g);
      
      return (
        <div className="space-y-4 text-slate-300">
          {parts.map((part, index) => {
            if (part.trim().startsWith('\\x60\\x60\\x60')) {
               const code = part.replace(/\\x60\\x60\\x60(\\w+)?/g, '').replace(/\\x60\\x60\\x60/g, '').trim();
               return (
                 <div key={index} className="relative my-4 rounded-lg overflow-hidden border border-slate-700">
                    <div className="bg-slate-800 px-4 py-1 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-700">JSON Payload</div>
                    <pre className="p-4 bg-slate-900 text-sm text-blue-200 font-mono overflow-x-auto">{code}</pre>
                 </div>
               );
            }
            // Render Text
            return part.split('\\n').map((line, i) => {
                if (!line.trim()) return null;
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2">{line.replace('### ', '')}</h3>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-slate-800 pb-2">{line.replace('## ', '')}</h2>;
                
                // Helper to process bold/code inline
                const processInline = (text) => {
                    const chunks = text.split(/(\\*\\*.*?\\*\\*|\\x60.*?\\x60)/g);
                    return chunks.map((chunk, cIdx) => {
                        if (chunk.startsWith('**') && chunk.endsWith('**')) {
                            return <strong key={cIdx} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>;
                        }
                        if (chunk.startsWith('\\x60') && chunk.endsWith('\\x60')) {
                            return <code key={cIdx} className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs border border-slate-700">{chunk.slice(1, -1)}</code>;
                        }
                        return <span key={cIdx}>{chunk}</span>;
                    });
                };

                if (line.startsWith('- ')) {
                     return <li key={i} className="ml-4 list-disc text-slate-300 mb-1 pl-1 marker:text-blue-500">{processInline(line.replace('- ', ''))}</li>;
                }

                return <p key={i} className="mb-3 leading-relaxed">{processInline(line)}</p>;
            });
          })}
        </div>
      );
    };

    const SequenceViewer = () => {
      const [activeId, setActiveId] = useState(SCENARIOS[0].id);
      const [activeStepIndex, setActiveStepIndex] = useState(null);
      const [isPlaying, setIsPlaying] = useState(false);
      
      const scenario = SCENARIOS.find(s => s.id === activeId);
      const activeStep = activeStepIndex !== null ? scenario.steps[activeStepIndex] : null;

      useEffect(() => {
        let interval;
        if (isPlaying) {
          interval = setInterval(() => {
            setActiveStepIndex(current => {
              const next = (current === null) ? 0 : current + 1;
              if (next < scenario.steps.length) {
                return next;
              } else {
                setIsPlaying(false);
                return current;
              }
            });
          }, 1500);
        }
        return () => clearInterval(interval);
      }, [isPlaying, scenario]);

      const handleScenarioChange = (id) => {
        setActiveId(id);
        setActiveStepIndex(null);
        setIsPlaying(false);
      };

      const colMap = { 'Tap': 0, 'ValveBox': 1, 'Keg1': 2, 'Keg2': 3 };
      const deviceNames = ['Tap', 'ValveBox', 'Keg1', 'Keg2'];

      return (
        <div className="flex flex-col gap-6 mt-6 animate-in fade-in">
          {/* CONTROLS & DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             {/* Left Control Panel */}
             <div className="lg:col-span-4 flex flex-col gap-4">
                 <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scenario Selection</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={"flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-xs text-white transition-all " + (isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-500')}
                            >
                                {isPlaying ? <><Icons.Pause /> Pause</> : <><Icons.Play /> Auto-Play</>}
                            </button>
                            <button 
                                onClick={() => { setIsPlaying(false); setActiveStepIndex(null); }}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs border border-slate-600"
                            >
                                <Icons.Refresh />
                            </button>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        {SCENARIOS.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => handleScenarioChange(s.id)}
                                className={"w-full text-left px-4 py-3 rounded-lg text-sm transition-all border " + (activeId === s.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-700/50 text-slate-300 border-transparent hover:bg-slate-700 hover:border-slate-600')}
                            >
                                <div className="font-bold">{s.title}</div>
                                <div className="text-xs opacity-75 truncate mt-0.5">{s.description}</div>
                            </button>
                        ))}
                     </div>
                 </div>

                 <div className={"bg-slate-900 p-5 rounded-xl border shadow-xl transition-all duration-300 flex-1 flex flex-col " + (activeStep ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-slate-800')}>
                     <div className="flex justify-between mb-3 items-center">
                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                            {activeStep ? \`Step \${String(activeStep.id).padStart(2, '0')}\` : 'Step Details'}
                        </span>
                        {activeStep && <span className="text-slate-500 text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {activeStep.type}
                        </span>}
                     </div>
                     <p className="text-white text-sm mb-4 min-h-[3rem] leading-relaxed">
                        {activeStep?.description || 'Select a step or press Auto-Play to view details.'}
                     </p>
                     <div className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-green-400 overflow-x-auto flex-1 border border-slate-800">
                        {activeStep?.payload ? JSON.stringify(activeStep.payload, null, 2) : '// No Payload Selected'}
                     </div>
                 </div>
             </div>

             {/* Visualizer */}
             <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-700 p-8 relative min-h-[500px] select-none overflow-hidden diagram-grid">
                {/* Lifelines */}
                <div className="grid grid-cols-4 h-full absolute top-0 left-0 w-full pointer-events-none z-0 px-8">
                     <div className="border-r border-slate-800/50 h-full mx-auto w-0"></div>
                     <div className="border-r border-slate-800/50 h-full mx-auto w-0"></div>
                     <div className="border-r border-slate-800/50 h-full mx-auto w-0"></div>
                     <div className="h-full mx-auto w-0"></div>
                </div>

                {/* Header Icons */}
                <div className="grid grid-cols-4 mb-10 relative z-10">
                    {deviceNames.map((device, i) => (
                        <div key={i} className="flex flex-col items-center group">
                            <div className={"w-14 h-14 rounded-2xl flex items-center justify-center text-[10px] font-bold border shadow-xl transition-all duration-300 mb-2 " +
                                (device === 'ValveBox' ? 'bg-gradient-to-br from-amber-900 to-amber-950 border-amber-700/50 text-amber-100' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-200') + " " +
                                (activeStep && (activeStep.from === device || activeStep.to === device) ? 'scale-110 ring-2 ring-white/20 brightness-110' : 'opacity-80')
                            }>
                                {device.replace(/([A-Z])/g, '\\n$1')}
                            </div>
                            <div className="h-full w-0.5 bg-slate-700/30 absolute top-14 -z-10 group-hover:bg-slate-700/50 transition-colors"></div>
                        </div>
                    ))}
                </div>

                {/* Timeline Steps */}
                <div className="space-y-3 relative z-10">
                    {scenario.steps.map((step, index) => {
                        const startCol = colMap[step.from];
                        const endCol = colMap[step.to];
                        const isSelf = startCol === endCol;
                        const direction = endCol > startCol ? 'ltr' : 'rtl';
                        
                        // Position calculation
                        const leftPos = (Math.min(startCol, endCol) * 25 + 12.5) + '%';
                        const width = isSelf ? '25%' : \`calc(\${Math.abs(endCol - startCol) * 25}%)\`;
                        
                        const isActive = activeStep && activeStep.id === step.id;

                        return (
                            <div 
                                key={step.id} 
                                className={"relative h-12 flex items-center group cursor-pointer transition-all duration-300 " + (isActive ? 'opacity-100 scale-[1.02]' : 'opacity-40 hover:opacity-80')}
                                onClick={() => { setActiveStepIndex(index); setIsPlaying(false); }}
                            >
                                <div className={"absolute left-0 -top-3 text-[9px] font-mono transition-colors " + (isActive ? 'text-blue-400 font-bold' : 'text-slate-600')}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </div>
                                
                                {isSelf ? (
                                     <div 
                                        style={{ left: (startCol * 25 + 12.5) + '%' }}
                                        className={"absolute flex items-center justify-center w-8 h-8 border border-dashed rounded-full z-20 transition-colors transform -translate-x-1/2 " + (isActive ? 'bg-blue-900/80 border-blue-400 text-blue-200' : 'bg-slate-800/50 border-slate-600 text-transparent')}
                                     >
                                        <Icons.Check />
                                     </div>
                                ) : (
                                    <div 
                                        style={{ left: leftPos, width: width }}
                                        className={"absolute h-0.5 flex items-center " + (direction === 'rtl' ? 'flex-row-reverse' : '') + " " + (isActive ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-slate-700')}
                                    >
                                        <div className={"w-2 h-2 rounded-full " + (isActive ? 'bg-blue-400' : 'bg-slate-600') + " " + (direction === 'rtl' ? '-ml-1' : '-mr-1')}></div>
                                        <div className={"absolute -top-6 w-full text-center text-[10px] font-mono truncate px-3 py-1 rounded-full transition-all " + (isActive ? 'text-white bg-blue-600 scale-110 z-30 shadow-lg border border-blue-400' : 'text-slate-400 bg-slate-800 border border-slate-700')}>
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
        </div>
      );
    };

    const App = () => {
      const [activeId, setActiveId] = useState(SECTIONS[0].id);
      const activeDoc = useMemo(() => SECTIONS.find(d => d.id === activeId) || SECTIONS[0], [activeId]);

      // Group navigation
      const navStructure = useMemo(() => {
        const cats = {};
        SECTIONS.forEach(doc => {
            if (!cats[doc.category]) cats[doc.category] = [];
            cats[doc.category].push(doc);
        });
        return cats;
      }, []);

      return (
        <div className="min-h-screen flex flex-col md:flex-row max-w-[1600px] mx-auto bg-slate-950 shadow-2xl overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-full md:w-72 bg-slate-950 border-r border-slate-800 p-6 overflow-y-auto h-auto md:h-screen sticky top-0 shrink-0">
            <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2 tracking-tight">
               <div className="text-blue-500"><Icons.Menu /></div> SmartTap<span className="text-slate-500">Docs</span>
            </h1>
            <div className="text-xs text-slate-500 mb-8 font-mono ml-8">OFFLINE MODE</div>
            
            <div className="space-y-8">
              {Object.entries(navStructure).map(([cat, docs]) => (
                 <div key={cat}>
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2 border-l-2 border-transparent">{cat}</h5>
                    <div className="space-y-0.5">
                        {docs.map(doc => (
                            <button
                            key={doc.id}
                            onClick={() => setActiveId(doc.id)}
                            className={"block w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 " + (activeId === doc.id ? 'bg-blue-900/20 text-blue-400 font-medium translate-x-1' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900')}
                            >
                            {doc.title.replace(/^\\d+\\.\\s/, '')}
                            </button>
                        ))}
                    </div>
                 </div>
              ))}
              
              <div className="pt-4 border-t border-slate-800">
                 <h5 className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-3 pl-2">Interactive</h5>
                 <button
                    onClick={() => setActiveId('scenarios')}
                    className={"block w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 " + (activeId === 'scenarios' ? 'bg-amber-900/20 text-amber-400 font-medium translate-x-1' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900')}
                 >
                    Sequence Diagrams
                 </button>
              </div>
            </div>
          </aside>

          {/* CONTENT AREA */}
          <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen scrollbar-hide">
            {activeId === 'scenarios' ? (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                 <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-3">Sequence Visualizer</h2>
                    <p className="text-slate-400 max-w-2xl leading-relaxed">
                        Visualize the MQTT message flow between the Tap, Valve Box, and Kegs during critical system events. 
                        Use the controls to animate the sequence.
                    </p>
                 </div>
                 <SequenceViewer />
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 max-w-4xl">
                <div className="flex items-center gap-2 text-blue-500 text-xs font-mono mb-3 uppercase tracking-widest font-semibold">
                    {activeDoc.category} <span className="text-slate-600">/</span> {activeDoc.id}
                </div>
                <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">{activeDoc.title}</h2>
                <MarkdownRenderer content={activeDoc.content} />
              </div>
            )}
            
            <footer className="mt-20 pt-8 border-t border-slate-800 text-slate-600 text-xs text-center font-mono">
              SmartTap Documentation • Generated {new Date().toLocaleDateString()}
            </footer>
          </main>
        </div>
      );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smart-tap-docs-offline.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
