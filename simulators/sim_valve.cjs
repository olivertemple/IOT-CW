
const mqtt = require('mqtt');

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: node sim_valve.cjs [SYSTEM_ID]');
    console.log('  SYSTEM_ID   MQTT system id / tap id (default tap-01)');
    console.log('Options: --help, -h   show this help');
    process.exit(0);
}

const SYSTEM_ID = argv[0] || 'tap-01';
const BROKER = 'mqtt://smart-tap.olivertemple.dev:1883';

const KEG_LIST = ['keg-A', 'keg-B', 'keg-C'];
let activeKegIndex = 0;

let currentKegId = KEG_LIST[activeKegIndex];
let isPouring = false;
let currentBeerName = "Hazy IPA";
let currentVolPct = null;
let heartbeatInterval = null;

const PUB = '\x1b[32m';
const SUB = '\x1b[36m';
const LOG = '\x1b[33m';
const ERR = '\x1b[31m';
const RESET = '\x1b[0m';

const client = mqtt.connect(BROKER);

console.log(`--- VALVE BOX CONTROLLER (${SYSTEM_ID}) ---`);
console.log(`${LOG}[INIT] Active Keg selected: ${currentKegId}${RESET}`);

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker${RESET}`);

    client.subscribe(`${SYSTEM_ID}/ui/event`);
    
    client.subscribe(`${SYSTEM_ID}/keg/+/status`);
    client.subscribe(`${SYSTEM_ID}/keg/+/event`);
    
    console.log(`${LOG}[SYSTEM] Listening for UI events and Keg updates...${RESET}`);
    
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
        sendUiUpdate(isPouring ? 'POURING' : 'IDLE', null);
    }, 20000);
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    
    if (topic.includes('/ui/event')) {
        console.log(`${SUB}[SUB]  UI EVENT: ${payload.event}${RESET}`);
        handleUiEvent(payload);
    }

    else if (topic.includes('/status')) {
        if (topic.includes(currentKegId)) {
            updateScreenFromTelemetry(payload);
        }
    }

    else if (topic.includes('/event')) {
        const signalingKeg = topic.split('/')[2];
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
        
        sendUiUpdate('POURING', null);
    } 
    else if (payload.event === 'POUR_STOP') {
        isPouring = false;
        console.log(`${LOG}[LOGIC] Closing Valves for ${currentKegId}${RESET}`);
        
        const command = { action: 'STOP_PUMP' };
        
        console.log(`${PUB}[PUB]  CMD -> ${currentKegId}: STOP_PUMP${RESET}`);
        client.publish(topic, JSON.stringify(command));

        sendUiUpdate('IDLE', null);
    }
}

function handleKegEmpty() {
    console.log(`${ERR}[CRITICAL] KEG EMPTY! Initiating Failover Sequence...${RESET}`);
    
    const oldKeg = currentKegId;
    const newKegIndex = (activeKegIndex + 1) % KEG_LIST.length;
    const newKeg = KEG_LIST[newKegIndex];

    const stopTopic = `${SYSTEM_ID}/keg/${oldKeg}/command`;
    client.publish(stopTopic, JSON.stringify({ action: 'STOP_PUMP' }));
    console.log(`${PUB}[PUB]  CMD -> ${oldKeg}: STOP_PUMP${RESET}`);

    sendUiUpdate('SWAP', `Switching ${oldKeg} -> ${newKeg}`, 0);

    activeKegIndex = newKegIndex;
    currentKegId = newKeg;
    
    currentVolPct = 100;
    
    console.log(`${LOG}[LOGIC] Switched Manifold: ${oldKeg} -> ${currentKegId}${RESET}`);

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
    const pct = Math.round((telemetry.vol_remaining_ml / 20000) * 100);
    
    currentVolPct = pct;
    
    if (telemetry.beer_name) {
        currentBeerName = telemetry.beer_name;
    }
    
    sendUiUpdate(isPouring ? 'POURING' : 'IDLE', null);
}

function sendUiUpdate(view, alert, pctOverride = null) {
    const pct = pctOverride !== null ? pctOverride : (currentVolPct !== null ? currentVolPct : 0);
    
    const payload = {
        view: view,
        beer_name: currentBeerName,
        volume_remaining_pct: pct,
        alert: alert
    };
    console.log(`DATA: ${JSON.stringify(payload)}`);
    client.publish(`${SYSTEM_ID}/ui/display`, JSON.stringify(payload));
}
