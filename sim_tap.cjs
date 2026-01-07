
const mqtt = require('mqtt');
const readline = require('readline');

// Configuration
const SYSTEM_ID = 'tap-01';
const BROKER = 'mqtt://test.mosquitto.org'; // Public test broker

const client = mqtt.connect(BROKER);

// ANSI Colors for logging
const PUB = '\x1b[32m'; // Green
const SUB = '\x1b[36m'; // Cyan
const LOG = '\x1b[33m'; // Yellow
const RESET = '\x1b[0m';

// State
let isPouring = false;

console.log(`--- SMART TAP UI SIMULATION (${SYSTEM_ID}) ---`);
console.log("Controls: Press [ENTER] to toggle Pour Start/Stop\n");

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker ${BROKER}${RESET}`);
    
    // Subscribe to Display updates from Valve Box
    const topic = `${SYSTEM_ID}/ui/display`;
    client.subscribe(topic);
    console.log(`${LOG}[SYSTEM] Subscribed to ${topic}${RESET}`);
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    console.log(`${SUB}[SUB]  TOPIC: ${topic}${RESET}`);
    console.log(`${SUB}       DATA:  ${JSON.stringify(payload)}${RESET}`);
    
    // Only render "screen" if running interactively, not when piped to dashboard
    if (process.stdin.isTTY) {
        console.log(`\n\t+----------------------------------+`);
        console.log(`\t| SCREEN UPDATE: ${payload.view.padEnd(17)} |`);
        console.log(`\t| Beer: ${payload.beer_name ? payload.beer_name.padEnd(24) : 'N/A                     '} |`);
        console.log(`\t| Rem : ${(payload.volume_remaining_pct + '%').padEnd(24)} |`);
        if(payload.alert) console.log(`\t| ALERT: ${payload.alert.padEnd(24)}|`);
        console.log(`\t+----------------------------------+\n`);
    }
});

// Handle User Input
if (process.stdin.isTTY) {
    // Interactive Mode (Standalone)
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'c' && key.ctrl) {
            process.exit();
        }
        
        if (key.name === 'return') {
            togglePour();
        }
    });
} else {
    // Piped Mode (Running via dashboard.js)
    process.stdin.on('data', (data) => {
        // Check for newline which signifies ENTER from dashboard
        if (data.toString().includes('\n')) {
            togglePour();
        }
    });
}

function togglePour() {
    isPouring = !isPouring;
    const eventType = isPouring ? 'POUR_START' : 'POUR_STOP';
    const topic = `${SYSTEM_ID}/ui/event`;
    
    const payload = {
        event: eventType,
        timestamp: Date.now()
    };

    console.log(`${PUB}[PUB]  TOPIC: ${topic}${RESET}`);
    console.log(`${PUB}       DATA:  ${JSON.stringify(payload)}${RESET}`);
    
    client.publish(topic, JSON.stringify(payload));
}
