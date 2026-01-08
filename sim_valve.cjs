
const mqtt = require('mqtt');

// Configuration - Accept tap name from command line
const SYSTEM_ID = process.argv[2] || 'tap-01';
const BROKER = 'mqtt://test.mosquitto.org';

// Simulated Known Kegs (In a real system, these might be discovered or configured)
const KEG_LIST = ['keg-A', 'keg-B', 'keg-C'];
let activeKegIndex = 0; // Start with keg-A

// Internal State
let currentKegId = KEG_LIST[activeKegIndex];
let isPouring = false;
let currentBeerName = "Hazy IPA";
let currentVolPct = null; // Unknown until telemetry arrives

// ANSI Colors
const PUB = '\x1b[32m';
const SUB = '\x1b[36m';
const LOG = '\x1b[33m'; // Yellow for Internal Logic
const ERR = '\x1b[31m';
const RESET = '\x1b[0m';

const client = mqtt.connect(BROKER);

console.log(`--- VALVE BOX CONTROLLER (${SYSTEM_ID}) ---`);
console.log(`${LOG}[INIT] Active Keg selected: ${currentKegId}${RESET}`);

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker${RESET}`);

    // Subscribe to UI events
    client.subscribe(`${SYSTEM_ID}/ui/event`);
    
    // Subscribe to ALL keg events and status using wildcard
    client.subscribe(`${SYSTEM_ID}/keg/+/status`);
    client.subscribe(`${SYSTEM_ID}/keg/+/event`);
    
    console.log(`${LOG}[SYSTEM] Listening for UI events and Keg updates...${RESET}`);
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    
    // 1. Handle User Pour Request
    if (topic.includes('/ui/event')) {
        console.log(`${SUB}[SUB]  UI EVENT: ${payload.event}${RESET}`);
        handleUiEvent(payload);
    }

    // 2. Handle Keg Telemetry (Status)
    else if (topic.includes('/status')) {
        // We use this to update the screen with % remaining
        // Only care if it's from the active keg
        if (topic.includes(currentKegId)) {
            updateScreenFromTelemetry(payload);
        }
    }

    // 3. Handle Keg Critical Events (EMPTY)
    else if (topic.includes('/event')) {
        // topic structure: tap-01/keg/keg-A/event
        const signalingKeg = topic.split('/')[2]; // extract ID (index 2)
        console.log(`${SUB}[SUB]  KEG EVENT from ${signalingKeg}: ${payload.event}${RESET}`);
        
        if (payload.event === 'EMPTY_DETECTED' && signalingKeg === currentKegId) {
            handleKegEmpty();
        }
    }
});

function handleUiEvent(payload) {
    const topic = `${SYSTEM_ID}/keg/${currentKegId}/command`;

    if (payload.event === 'POUR_START') {
        isPouring = true;
        console.log(`${LOG}[LOGIC] Opening Valves for ${currentKegId}${RESET}`);
        
        const command = { action: 'START_PUMP', pwm_duty: 255, timeout_ms: 30000 };
        
        console.log(`${PUB}[PUB]  CMD -> ${currentKegId}: START_PUMP${RESET}`);
        client.publish(topic, JSON.stringify(command));
        
        // Acknowledge to UI (Use stored currentVolPct)
        sendUiUpdate('POURING', null);
    } 
    else if (payload.event === 'POUR_STOP') {
        isPouring = false;
        console.log(`${LOG}[LOGIC] Closing Valves for ${currentKegId}${RESET}`);
        
        const command = { action: 'STOP_PUMP' };
        
        console.log(`${PUB}[PUB]  CMD -> ${currentKegId}: STOP_PUMP${RESET}`);
        client.publish(topic, JSON.stringify(command));

        // Acknowledge to UI (Use stored currentVolPct)
        sendUiUpdate('IDLE', null);
    }
}

function handleKegEmpty() {
    console.log(`${ERR}[CRITICAL] KEG EMPTY! Initiating Failover Sequence...${RESET}`);
    
    const oldKeg = currentKegId;
    const newKegIndex = (activeKegIndex + 1) % KEG_LIST.length;
    const newKeg = KEG_LIST[newKegIndex];

    // 1. Stop the empty keg (Safety)
    const stopTopic = `${SYSTEM_ID}/keg/${oldKeg}/command`;
    client.publish(stopTopic, JSON.stringify({ action: 'STOP_PUMP' }));
    console.log(`${PUB}[PUB]  CMD -> ${oldKeg}: STOP_PUMP${RESET}`);

    // 2. Update UI to show Swap (Explicitly show 0% for the empty keg)
    sendUiUpdate('SWAP', `Switching ${oldKeg} -> ${newKeg}`, 0);

    // 3. Switch Logic
    activeKegIndex = newKegIndex;
    currentKegId = newKeg;
    
    // Reset volume state for the new fresh keg
    currentVolPct = 100;
    
    console.log(`${LOG}[LOGIC] Switched Manifold: ${oldKeg} -> ${currentKegId}${RESET}`);

    // 4. Resume pouring on new keg (if user is still holding handle)
    if (isPouring) {
        setTimeout(() => {
            console.log(`${PUB}[PUB]  Resuming flow on new keg: ${currentKegId}${RESET}`);
            const startTopic = `${SYSTEM_ID}/keg/${currentKegId}/command`;
            client.publish(startTopic, JSON.stringify({ 
                action: 'START_PUMP', 
                pwm_duty: 255, 
                timeout_ms: 30000 
            }));
            
            sendUiUpdate('POURING', null);
        }, 1000); // 1 second delay for mechanical valve swap
    } else {
        sendUiUpdate('IDLE', null);
    }
}

function updateScreenFromTelemetry(telemetry) {
    // Simple calculation for % based on max 20L (20000ml)
    const pct = Math.round((telemetry.vol_remaining_ml / 20000) * 100);
    
    // Update internal state so we don't glitch when changing UI views
    currentVolPct = pct;
    
    // Update beer name from telemetry if provided
    if (telemetry.beer_name) {
        currentBeerName = telemetry.beer_name;
    }
    
    sendUiUpdate(isPouring ? 'POURING' : 'IDLE', null);
}

function sendUiUpdate(view, alert, pctOverride = null) {
    // Use the override if provided (e.g. forcing 0% on empty), otherwise use current known state.
    // If we haven't yet received telemetry, fall back to 0 to avoid briefly advertising 100%.
    const pct = pctOverride !== null ? pctOverride : (currentVolPct !== null ? currentVolPct : 0);
    
    const payload = {
        view: view,
        beer_name: currentBeerName,
        volume_remaining_pct: pct,
        alert: alert
    };
    // Log DATA for Dashboard
    console.log(`DATA: ${JSON.stringify(payload)}`);
    client.publish(`${SYSTEM_ID}/ui/display`, JSON.stringify(payload));
}
