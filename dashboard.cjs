
const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- HELPER FUNCTIONS ---

// Regex to strip ANSI codes (Removes dependency on 'strip-ansi' package which causes ESM/CJS issues)
function stripAnsi(str) {
  // Pattern matches standard ANSI escape sequences
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// Helper to find the script whether it is .js or .cjs
function resolveScriptPath(baseName) {
    const extensions = ['.cjs', '.js'];
    for (const ext of extensions) {
        const fullPath = path.join(__dirname, baseName + ext);
        if (fs.existsSync(fullPath)) return fullPath;
    }
    // Fallback to .js if nothing found (will let spawn handle the error)
    return path.join(__dirname, baseName + '.js');
}

// --- CONFIGURATION ---
const KEGS = [
  { id: 'keg-A', vol: 1000 }, // Start low to test auto-swap quickly
  { id: 'keg-B', vol: 20000 }, // Full backup
  { id: 'keg-C', vol: 20000 }  // Extra backup
];

// --- STATE MANAGEMENT ---
const systemState = {
  tap: { view: 'OFFLINE', beer: '---', pct: 0, alert: '' },
  valve: { activeKeg: '---', pouring: false },
  kegs: {}
};

// Initialize Keg State
KEGS.forEach(k => {
  systemState.kegs[k.id] = { 
    state: 'OFFLINE', 
    vol: k.vol, 
    temp: 0, 
    flow: 0 
  };
});

// --- UI SETUP ---
const screen = blessed.screen({
  smartCSR: true,
  title: 'SmartTap IoT Dashboard'
});

const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// 1. Header / Tap Display (Top Left)
const tapDisplay = grid.set(0, 0, 4, 6, blessed.box, {
  label: ' Tap UI Display ',
  tags: true,
  style: { border: { fg: 'blue' } }
});

// 2. Valve Controller Status (Top Right)
const valveStatus = grid.set(0, 6, 4, 6, blessed.box, {
  label: ' Valve Box Logic ',
  tags: true,
  style: { border: { fg: 'yellow' } }
});

// 3. Keg Table (Middle)
const kegTable = grid.set(4, 0, 4, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: false,
  label: ' Connected Kegs ',
  width: '30%',
  height: '30%',
  border: {type: "line", fg: "cyan"},
  columnSpacing: 3,
  columnWidth: [10, 12, 15, 10, 10, 10]
});

// 4. Event Log (Bottom)
const eventLog = grid.set(8, 0, 4, 12, contrib.log, {
  fg: 'green',
  selectedFg: 'green',
  label: ' System Event Stream ',
  style: { border: { fg: 'green' } }
});

// --- PROCESS MANAGEMENT ---
const children = [];

function spawnProcess(label, cmd, args) {
  // Check if file exists first
  if (args[0] && !fs.existsSync(args[0])) {
     eventLog.log(`{red-fg}ERR ${label}: Script file not found at ${args[0]}{/red-fg}`);
     return null;
  }

  const p = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'], // We need pipe for stdin (control) and stdout (parsing)
    cwd: __dirname // Ensures node_modules are found relative to this script
  });

  p.stdout.on('data', (data) => {
    const text = data.toString();
    // Pass raw text to the parser
    parseOutput(label, text);
    
    // Log simplified lines to the bottom window
    const cleanText = stripAnsi(text).trim();
    if (cleanText) {
        cleanText.split('\n').forEach(line => {
            if(line.includes('DATA:') || line.includes('TOPIC:')) return; // Skip raw protocol noise in visual log
            if(line.length > 5) eventLog.log(`${label}: ${line}`);
        });
    }
  });

  p.stderr.on('data', (data) => {
    const errText = data.toString();
    eventLog.log(`{red-fg}ERR ${label}: ${errText}{/red-fg}`);
    
    if (errText.includes('MODULE_NOT_FOUND')) {
        eventLog.log(`{yellow-fg}HINT: Run "npm install mqtt" in this directory.{/yellow-fg}`);
    }
  });
  
  p.on('exit', (code) => {
      eventLog.log(`{red-fg}EXIT ${label}: Process exited with code ${code}{/red-fg}`);
  });

  children.push(p);
  return p;
}

// Start Simulations using robust path resolution (.cjs or .js)
const valveProcess = spawnProcess('[VALVE]', 'node', [resolveScriptPath('sim_valve')]);
const tapProcess = spawnProcess('[TAP]', 'node', [resolveScriptPath('sim_tap')]);

const kegProcesses = KEGS.map(k => {
  return spawnProcess(`[${k.id}]`, 'node', [resolveScriptPath('sim_keg'), k.id, k.vol.toString()]);
});

// --- PARSING LOGIC ---
function parseOutput(source, text) {
  // Strip ANSI codes before processing
  const lines = stripAnsi(text).split('\n');
  
  lines.forEach(line => {
    if (line.trim().startsWith('DATA:')) {
      try {
        const jsonStr = line.replace('DATA:', '').trim();
        const data = JSON.parse(jsonStr);
        updateState(source, data);
      } catch (e) {
        // Ignore parse errors (sometimes chunks are split)
      }
    }
  });
  
  renderUI();
}

function updateState(source, data) {
  // Identify payload type by fields
  
  // 1. Tap UI Display Update (From Valve -> Tap)
  if (data.view) {
    systemState.tap = {
      view: data.view,
      beer: data.beer_name,
      pct: data.volume_remaining_pct,
      alert: data.alert
    };
  }

  // 2. Keg Status (From Keg -> Valve)
  if (data.vol_remaining_ml !== undefined) {
    const kegId = source.replace('[', '').replace(']', '');
    if (systemState.kegs[kegId]) {
        systemState.kegs[kegId] = {
            state: data.state,
            vol: data.vol_remaining_ml,
            temp: data.temp_beer_c,
            flow: data.flow_lpm
        };
        
        if (data.state === 'PUMPING') {
            systemState.valve.activeKeg = kegId;
            systemState.valve.pouring = true;
        } else if (systemState.valve.activeKeg === kegId && data.state === 'IDLE') {
            // Only set valve to IDLE if the reporting keg is the active one
            systemState.valve.pouring = false;
        }
    }
  }
}

// --- RENDERING ---
function renderUI() {
  // 1. Tap UI
  let tapContent = `\n{center}{bold}${systemState.tap.view}{/bold}{/center}\n\n`;
  tapContent += `  Beer:   ${systemState.tap.beer}\n`;
  tapContent += `  Volume: ${systemState.tap.pct}%\n`;
  if (systemState.tap.alert) {
      tapContent += `\n  {red-fg}ALERT:  ${systemState.tap.alert}{/red-fg}`;
  }
  tapDisplay.setContent(tapContent);

  // 2. Valve Status
  let valveContent = `\n  Active Keg: {bold}${systemState.valve.activeKeg}{/bold}\n`;
  valveContent += `  Status:     ${systemState.valve.pouring ? '{green-fg}PUMPING{/green-fg}' : 'IDLE'}\n`;
  valveContent += `  System ID:  tap-01\n`;
  valveStatus.setContent(valveContent);

  // 3. Keg Table
  const tableData = Object.keys(systemState.kegs).map(id => {
    const k = systemState.kegs[id];
    return [
        id, 
        k.state, 
        `${k.vol} ml`, 
        `${k.flow.toFixed(1)} LPM`, 
        `${k.temp}°C`,
        ((k.vol / 20000)*100).toFixed(0) + '%'
    ];
  });
  
  kegTable.setData({
    headers: ['KEG ID', 'STATE', 'VOLUME', 'FLOW', 'TEMP', 'REMAINING'],
    data: tableData
  });

  screen.render();
}

// --- INPUT HANDLING ---

// Capture keys to control the simulation
screen.key(['enter'], (ch, key) => {
  eventLog.log('{blue-fg}[USER] Toggled Tap Handle (ENTER){/blue-fg}');
  // Send a newline to the Tap Process stdin to simulate keypress
  if (tapProcess) tapProcess.stdin.write('\n');
});

screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  children.forEach(c => c.kill());
  return process.exit(0);
});

// Initial Render
renderUI();
eventLog.log("--- SYSTEM STARTED ---");
eventLog.log("Press [ENTER] to toggle Pour");
eventLog.log("Press [Q] to Quit");
